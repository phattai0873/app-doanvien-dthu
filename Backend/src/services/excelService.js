const xlsx = require('xlsx');
const { 
    UnionMember, 
    User, 
    UserSensitiveData, 
    UnionCell, 
    UnionBranch, 
    UnionMemberHistory,
    ImportPreview,
    UnionPosition,
    UnionMemberPosition,
    sequelize 
} = require('../models');
const { safeDate } = require('../utils/dateUtils');
const ErrorResponse = require('../utils/errorResponse');
const { encrypt } = require('../utils/crypto');

class ExcelService {
    /**
     * Parse Excel and generate a secure preview saved in DB
     */
    static async generatePreview(buffer, { mode = 'AUTO', unionCellId = null }, user) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // Tìm dòng header (Bắt đầu từ STT hoặc Họ và tên)
        const startRow = 6; // Dòng 7 trong Excel (index 6)
        const previewRows = [];
        const summary = { total: 0, valid: 0, error: 0, warning: 0 };
        const codesInFile = new Set();
        
        // Cache Chi đoàn để tối ưu
        const cellCache = {};
        if (unionCellId) {
            cellCache[unionCellId] = await UnionCell.findByPk(unionCellId);
        }

        for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length < 2 || !row[1]) continue;

            summary.total++;
            const memberData = this._mapRowToMember(row);
            const rowResult = {
                index: i + 1,
                data: memberData,
                status: 'VALID',
                message: [],
                targetCellName: '',
                targetCellId: null
            };

            // 1. Validate Formats
            if (memberData.identityNumber && !/^\d{9}(\d{3})?$/.test(memberData.identityNumber)) {
                rowResult.status = 'ERROR';
                rowResult.message.push(`Số định danh không hợp lệ: ${memberData.identityNumber}`);
            }
            if (memberData.email && !/^\S+@\S+\.\S+$/.test(memberData.email)) {
                rowResult.status = 'WARNING';
                rowResult.message.push(`Email có vẻ không hợp lệ: ${memberData.email}`);
            }

            // 2. Validate Uniqueness in file
            if (codesInFile.has(memberData.memberCode)) {
                rowResult.status = 'ERROR';
                rowResult.message.push(`Mã đoàn viên ${memberData.memberCode} đang bị lặp lại trong file này`);
            }
            codesInFile.add(memberData.memberCode);

            // 3. Mapping Chi đoàn
            const excelCellCode = row[32] ? String(row[32]).trim() : '';
            
            if (mode === 'FORCE' && unionCellId) {
                rowResult.targetCellId = unionCellId;
                rowResult.targetCellName = cellCache[unionCellId]?.name || 'Chi đoàn đã chọn';
            } else if (mode === 'VALIDATE' && unionCellId) {
                const targetCell = cellCache[unionCellId];
                if (!excelCellCode) {
                    rowResult.status = 'ERROR';
                    rowResult.message.push('File thiếu thông tin Đơn vị trong khi yêu cầu xác thực');
                } else if (!this._compareCell(excelCellCode, targetCell)) {
                    rowResult.status = 'WARNING';
                    rowResult.message.push(`Mã đơn vị trong file (${excelCellCode}) không khớp với Chi đoàn đã chọn (${targetCell.name})`);
                    rowResult.targetCellId = unionCellId;
                    rowResult.targetCellName = targetCell.name;
                } else {
                    rowResult.targetCellId = unionCellId;
                    rowResult.targetCellName = targetCell.name;
                }
            } else {
                // Mode AUTO hoặc Fallback
                if (!excelCellCode) {
                    rowResult.status = 'ERROR';
                    rowResult.message.push('Không tìm thấy thông tin Đơn vị/Lớp trong file');
                } else {
                    const matchedCell = await this._findCellSmart(excelCellCode);
                    if (matchedCell) {
                        rowResult.targetCellId = matchedCell.id;
                        rowResult.targetCellName = matchedCell.name;
                    } else {
                        rowResult.status = 'ERROR';
                        rowResult.message.push(`Không tìm thấy Chi đoàn có mã hoặc tên: "${excelCellCode}" trong hệ thống`);
                    }
                }
            }

            // 4. Check Uniqueness in DB
            const existing = await UnionMember.findOne({ where: { memberCode: memberData.memberCode }, paranoid: false });
            if (existing) {
                rowResult.status = 'ERROR';
                rowResult.message.push(`Mã đoàn viên ${memberData.memberCode} đã tồn tại trong hệ thống`);
            }

            if (rowResult.status === 'ERROR') summary.error++;
            else if (rowResult.status === 'WARNING') summary.warning++;
            else summary.valid++;

            previewRows.push(rowResult);
        }

        // Save preview with expires in 1 hour
        const preview = await ImportPreview.create({
            data: previewRows,
            config: { mode, unionCellId },
            summary,
            createdBy: user.id,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        });

        return {
            previewId: preview.id,
            summary,
            rows: previewRows.slice(0, 100) // Trả về 100 dòng đầu để preview nhanh
        };
    }

    /**
     * Rename the synchronous method for internal worker use
     */
    static async executeImportSync(previewId, { strictMode = false }, user) {
        const preview = await ImportPreview.findByPk(previewId);
        if (!preview) throw new ErrorResponse('Phiên làm việc đã hết hạn hoặc không tồn tại. Vui lòng tải lại file.', 404);

        if (strictMode && preview.summary.error > 0) {
            throw new ErrorResponse(`Chế độ nghiêm ngặt: Có ${preview.summary.error} lỗi trong file. Không thể thực hiện nhập.`, 400);
        }

        const validRows = preview.data.filter(r => r.status !== 'ERROR');
        const results = { success: 0, skipped: preview.data.length - validRows.length, errors: [] };
        
        // Đảm bảo có chức vụ "Đoàn viên" để bổ nhiệm
        const [memberPos] = await UnionPosition.findOrCreate({
            where: { name: 'Đoàn viên' },
            defaults: { 
                name: 'Đoàn viên', 
                scopeLevel: 'CELL', 
                description: 'Chức vụ mặc định dành cho đoàn viên' 
            }
        });

        // CHUNKING: 100 rows per batch
        const chunkSize = 100;
        for (let i = 0; i < validRows.length; i += chunkSize) {
            const chunk = validRows.slice(i, i + chunkSize);
            const transaction = await sequelize.transaction();
            
            try {
                for (const row of chunk) {
                    const data = row.data;
                    const member = await UnionMember.create({
                        ...data,
                        unionCellId: row.targetCellId,
                        userId: null,
                        status: 'approved',
                        isActivated: false,
                        roleInUnion: 'member'
                    }, { transaction });

                    // Bổ nhiệm chức vụ Đoàn viên
                    await UnionMemberPosition.create({
                        unionMemberId: member.id,
                        unionPositionId: memberPos.id,
                        unionCellId: row.targetCellId,
                        isActive: true,
                        assignedDate: new Date()
                    }, { transaction });

                    if (data.identityNumber) {
                        const encrypted = encrypt(data.identityNumber);
                        if (encrypted) {
                            await UserSensitiveData.create({
                                unionMemberId: member.id,
                                identityNumberEncrypted: encrypted.encryptedData,
                                iv: encrypted.iv,
                                authTag: encrypted.authTag
                            }, { transaction });
                        }
                    }

                    await UnionMemberHistory.create({
                        unionMemberId: member.id,
                        type: 'status_change',
                        newValue: 'approved',
                        note: 'Nhập từ Excel (Enterprise Workflow)',
                        performedBy: user.id
                    }, { transaction });

                    results.success++;
                }
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                results.success -= chunk.length;
                results.skipped += chunk.length;
                results.errors.push(`Lỗi tại lô ${Math.floor(i/chunkSize) + 1}: ${err.message}`);
            }
        }

        // Cleanup
        await preview.destroy();

        return results;
    }

    /**
     * New executeImport: Pushes to BullMQ and returns immediately
     */
    static async executeImport(previewId, { strictMode = false }, user) {
        const { excelQueue } = require('../configs/queue');
        
        // Kiểm tra preview tồn tại trước khi đẩy vào queue
        const preview = await ImportPreview.findByPk(previewId);
        if (!preview) throw new ErrorResponse('Phiên làm việc đã hết hạn hoặc không tồn tại', 404);

        const job = await excelQueue.add('import-excel', {
            previewId,
            strictMode,
            userId: user.id
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true
        });

        return {
            jobId: job.id,
            message: 'Tệp tin đang được xử lý trong nền. Bạn có thể theo dõi tiến độ trong mục thông báo.'
        };
    }

    static _mapRowToMember(row) {
        const gender = row[3] ? 'male' : (row[4] ? 'female' : 'male');
        const dobRaw = row[3] || row[4];
        
        return {
            fullName: row[1] ? String(row[1]).trim() : '',
            memberCode: row[2] ? String(row[2]).trim() : '',
            gender: gender,
            dateOfBirth: this._parseExcelDate(dobRaw),
            ethnicity: row[5] || 'Kinh',
            religion: row[6] || 'Không',
            hometown: row[7] || '',
            permanentAddress: row[8] || '',
            identityNumber: row[9] ? String(row[9]).trim() : null,
            educationLevel: row[12],
            professionalLevel: row[13],
            politicalTheoryLevel: row[14],
            itLevel: row[15],
            languageLevel: row[16],
            joinedDate: this._parseExcelDate(row[17]),
            occupation: row[21],
            isHonoraryMember: (row[29] === 'X' || row[29] === 'x'),
            email: row[30] ? String(row[30]).trim() : null,
            phoneNumber: row[31] ? String(row[31]).trim() : null,
        };
    }

    static _parseExcelDate(val) {
        if (!val) return null;
        if (typeof val === 'number') {
            return new Date((val - (25567 + 1)) * 86400 * 1000);
        }
        return safeDate(val);
    }

    static async _findCellSmart(input) {
        if (!input) return null;
        const normalizedInput = this._normalize(input);
        
        // 1. Tìm theo mã (Strict)
        let cell = await UnionCell.findOne({ where: { code: input } });
        if (cell) return cell;

        // 2. Tìm theo tên (Normalize)
        const cells = await UnionCell.findAll();
        return cells.find(c => this._normalize(c.name) === normalizedInput || this._normalize(c.code) === normalizedInput);
    }

    static _compareCell(excelCode, targetCell) {
        if (!targetCell) return false;
        return this._normalize(excelCode) === this._normalize(targetCell.code) || 
               this._normalize(excelCode) === this._normalize(targetCell.name);
    }

    static _normalize(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/\s+/g, '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Xóa dấu
    }
}

module.exports = ExcelService;
