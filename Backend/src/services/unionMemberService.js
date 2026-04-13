const { UnionMember, UnionCell, UnionBranch, UnionPosition, UnionMemberPosition, User, UnionMemberHistory, Role, ProfileUpdateRequest, MemberEvaluation, MemberReward, MemberDiscipline, MembershipApproval, UserSensitiveData, AuditLog } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { safeDate } = require('../utils/dateUtils');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { Op } = require('sequelize');
const { getScopeFilter, enforceNestedScope, hasPermission, injectScope } = require('../utils/permissionHelper');

class UnionMemberService {
    /**
     * Lấy danh sách đoàn viên (Enterprise Scoping)
     */
    static async getAll({ unionCellId, unionBranchId, search, page, limit, roleInUnion, activityStatus, status, gender, onlyDeleted, user } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động theo Entity Type
        const scopeFilter = getScopeFilter(user, 'member');

        const where = {
            ...scopeFilter,
            ...buildSearchCondition(search, ['fullName', 'memberCode']),
        };

        // Lọc bổ sung từ Client (vẫn nằm trong scope nếu có)
        if (unionCellId) where.unionCellId = unionCellId;
        if (roleInUnion) where.roleInUnion = roleInUnion;
        if (activityStatus) where.activityStatus = activityStatus;
        if (status) where.status = status;
        if (gender) where.gender = gender;

        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'code', 'unionBranchId', 'secretaryId', 'deputySecretaryId'],
            include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }],
        };

        // Nếu client (Super Admin) muốn lọc theo một branchId cụ thể
        if (unionBranchId && unionBranchId !== 'undefined') {
            where['$UnionCell.unionBranchId$'] = unionBranchId;
        }

        const queryOptions = {
            where: {
                ...where,
                ...(search && {
                    [Op.or]: [
                        ...(where[Op.or] || []),
                        { '$User.email$': { [Op.iLike]: `%${search}%` } },
                        { '$User.phoneNumber$': { [Op.iLike]: `%${search}%` } }
                    ]
                })
            },
            subQuery: false,
            include: [
                cellInclude,
                { model: User, attributes: ['id', 'username', 'email', 'phoneNumber'], paranoid: false },
                { model: User, as: 'Approver', attributes: ['id', 'username'], paranoid: false },
                {
                    model: UnionPosition,
                    through: {
                        model: UnionMemberPosition,
                        where: { isActive: true },
                        attributes: ['unionBranchId', 'unionCellId']
                    },
                    required: false
                }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['fullName', 'ASC']],
            limit: l,
            offset
        };

        if (onlyDeleted === true || onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            queryOptions.where.deletedAt = { [Op.ne]: null };
        }

        const result = await UnionMember.findAndCountAll(queryOptions);

        // Bổ sung Masked CCCD vào danh sách (Sử dụng fallback nếu chưa migrate)
        result.rows = result.rows.map(m => {
            const plain = m.toJSON();
            const rawCCCD = plain.identityNumber; // Cột cũ
            plain.identityNumberMasked = this.getMaskedIdentityNumber(rawCCCD);
            return plain;
        });

        return formatPaginatedResponse(result, p, l);
    }

    /**
     * Masking CCCD (Enterprise Standard)
     */
    static getMaskedIdentityNumber(cccd) {
        if (!cccd) return '—';
        if (cccd.length < 6) return '******';
        return `${cccd.slice(0, 3)}*******${cccd.slice(-3)}`;
    }

    /**
     * Lấy chi tiết đoàn viên (Strict Scoping)
     */
    static async getById(id, user, returnInstance = false) {
        const member = await UnionMember.findByPk(id, {
            paranoid: false,
            include: [
                {
                    model: UnionCell,
                    paranoid: false,
                    attributes: ['id', 'name', 'code', 'unionBranchId'],
                    include: [{ model: UnionBranch, paranoid: false, attributes: ['id', 'name', 'code'] }]
                },
                { model: User, paranoid: false, attributes: ['id', 'username', 'email', 'phoneNumber', 'isActive', 'avatar', 'lastLogin'] },
                {
                    model: UnionPosition,
                    paranoid: false,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'endedDate', 'isActive'] }
                },
                { model: UnionMemberHistory, limit: 10, order: [['createdAt', 'DESC']] },
                { model: MemberEvaluation, as: 'Evaluations', order: [['year', 'DESC']] },
                { model: MemberReward, as: 'Rewards', order: [['issuedDate', 'DESC']] },
                { model: MemberDiscipline, as: 'Disciplines', order: [['issuedDate', 'DESC']] },
                { model: MembershipApproval, as: 'Approval' },
                { model: UserSensitiveData, as: 'SensitiveData' }
            ]
        });

        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        // 2. KIỂM TRA PHẠM VI
        const isSelf = (member.userId && user.id && String(member.userId) === String(user.id));
        if (!isSelf && !user.isSuperAdmin) {
            enforceNestedScope(user, member, ['UnionCell', 'unionBranchId']);
        }

        if (returnInstance) return member;

        // 3. XỬ LÝ SENSITIVE DATA (ENTERPRISE SECURITY)
        const canViewSensitive = user.isSuperAdmin || hasPermission(user, 'member:view_sensitive');
        const plainMember = member.toJSON();

        let identityNumberFull = null;
        if (member.SensitiveData) {
            identityNumberFull = member.SensitiveData.getDecryptedIdentityNumber();
        } else if (member.identityNumber) {
            // FALLBACK: Hỗ trợ dữ liệu cũ chưa migrate hoặc migration chưa thành công
            identityNumberFull = member.identityNumber;
        }

        if (canViewSensitive) {
            plainMember.identityNumberFull = identityNumberFull;
            plainMember.identityNumberMasked = this.getMaskedIdentityNumber(identityNumberFull);

            // GHI LOG TRUY CẬP (Nếu là xem người khác)
            if (!isSelf) {
                await AuditLog.create({
                    tableName: 'union_members',
                    recordId: member.id,
                    action: 'VIEW',
                    newValues: { detail: 'Truy cập thông tin CCCD đầy đủ' },
                    userId: user.id
                });
            }
        } else {
            plainMember.identityNumberMasked = this.getMaskedIdentityNumber(identityNumberFull);
            delete plainMember.SensitiveData; // Xóa sạch dữ liệu mã hóa để an toàn
        }

        return plainMember;
    }

    /**
     * Lấy hồ sơ đoàn viên theo UserId (Dùng cho My Profile)
     */
    static async getByUserId(userId) {
        const member = await UnionMember.findOne({
            where: { userId },
            include: [
                {
                    model: UnionCell,
                    attributes: ['id', 'name', 'code', 'unionBranchId'],
                    include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }]
                },
                { model: User, attributes: ['id', 'username', 'email', 'phoneNumber', 'isActive', 'avatar'] },
                {
                    model: UnionPosition,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'isActive'] }
                },
                { model: MemberEvaluation, as: 'Evaluations', order: [['year', 'DESC']] },
                { model: MemberReward, as: 'Rewards', order: [['issuedDate', 'DESC']] },
                { model: UserSensitiveData, as: 'SensitiveData' },
                {
                    model: ProfileUpdateRequest,
                    as: 'ProfileUpdateRequests',
                    where: { status: 'pending' },
                    required: false,
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!member) return null;

        const plainMember = member.toJSON();
        let identityNumberFull = null;
        if (member.SensitiveData) {
            identityNumberFull = member.SensitiveData.getDecryptedIdentityNumber();
        } else if (member.identityNumber) {
            identityNumberFull = member.identityNumber;
        }

        // Trên Mobile (My Profile), luôn Mask CCCD theo yêu cầu "Mobile Mask"
        plainMember.identityNumberMasked = this.getMaskedIdentityNumber(identityNumberFull);
        delete plainMember.SensitiveData; // Bảo mật tối đa trên Mobile

        return plainMember;
    }

    /**
     * Tạo hồ sơ đoàn viên (ID Injection Protected)
     */
    static async create(data, user) {
        const canCreateOthers = hasPermission(user, 'member:create');
        if (!canCreateOthers && data.userId !== user?.id) {
            throw new ErrorResponse('Bạn không có quyền tạo hồ sơ cho người khác', 403);
        }

        // 1. NGĂN CHẶN ID INJECTION
        injectScope(data, user, 'member');

        ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
            if (data[field]) data[field] = safeDate(data[field]);
        });

        if (!data.memberCode) data.memberCode = `DV-${Date.now()}`;

        const existing = await UnionMember.findOne({ where: { memberCode: data.memberCode } });
        if (existing) throw new ErrorResponse(`Mã đoàn viên "${data.memberCode}" đã tồn tại`, 400);

        const member = await UnionMember.create({ ...data, status: 'pending' });

        // 2. LƯU DỮ LIỆU NHẠY CẢM (CCCD MÃ HÓA)
        if (data.identityNumber) {
            const encrypted = UserSensitiveData.encryptIdentityNumber(data.identityNumber);
            if (encrypted) {
                await UserSensitiveData.create({
                    unionMemberId: member.id,
                    identityNumberEncrypted: encrypted.encryptedData,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag
                });
            }
        }

        if (member.userId && (data.email || data.phoneNumber)) {
            await User.update(
                { email: data.email, phoneNumber: data.phoneNumber },
                { where: { id: member.userId } }
            );
        }

        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'status_change',
            newValue: 'pending',
            note: 'Tạo mới hồ sơ đoàn viên'
        });

        return member;
    }

    /**
     * Cập nhật hồ sơ (Safe ID Overrides)
     */
    static async update(id, data, performerId, user) {
        const member = await this.getById(id, user, true);
        injectScope(data, user, 'member');

        ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
            if (data[field]) data[field] = safeDate(data[field]);
        });

        const isSelfUpdate = (member.userId && user.id && String(member.userId) === String(user.id)) ||
            (!member.userId && user.email && member.email === user.email);

        const canUpdateDirectly = hasPermission(user, 'member:update');

        if (isSelfUpdate && !user.isSuperAdmin) {
            // WHITELIST FIELDS CHO USER CẬP NHẬT
            const ALLOWED_PROFILE_FIELDS = [
                'fullName', 'dateOfBirth', 'gender', 'permanentAddress', 'hometown',
                'ethnicity', 'religion', 'professionalLevel', 'itLevel', 'languageLevel',
                'email', 'phoneNumber'
            ];

            const filteredData = {};
            ALLOWED_PROFILE_FIELDS.forEach(field => {
                if (data[field] !== undefined) filteredData[field] = data[field];
            });

            if (Object.keys(filteredData).length === 0) {
                throw new ErrorResponse('Không có thông tin hợp lệ để cập nhật', 400);
            }

            const oldData = {};
            Object.keys(filteredData).forEach(key => {
                if (member[key] !== undefined) oldData[key] = member[key];
            });

            const request = await ProfileUpdateRequest.create({
                unionMemberId: member.id,
                oldData,
                newData: filteredData,
                status: 'pending'
            });

            return { isRequest: true, message: 'Yêu cầu cập nhật hồ sơ đã được gửi để phê duyệt', data: request };
        }

        if (!isSelfUpdate && !canUpdateDirectly) {
            throw new ErrorResponse('Bạn không có quyền cập nhật hồ sơ cho người khác', 403);
        }

        const oldCellId = member.unionCellId;
        const oldRole = member.roleInUnion;

        if (!user.isSuperAdmin) {
            delete data.memberCode;
        }

        await member.update(data);

        // 2. CẬP NHẬT DỮ LIỆU NHẠY CẢM (CCCD MÃ HÓA)
        if (data.identityNumber) {
            const [sensitiveData] = await UserSensitiveData.findOrCreate({
                where: { unionMemberId: member.id }
            });
            const encrypted = UserSensitiveData.encryptIdentityNumber(data.identityNumber);
            if (encrypted) {
                await sensitiveData.update({
                    identityNumberEncrypted: encrypted.encryptedData,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag
                });
            }
        }

        if (member.userId && (data.email || data.phoneNumber)) {
            const userUpdate = {};
            if (data.email) userUpdate.email = data.email;
            if (data.phoneNumber) userUpdate.phoneNumber = data.phoneNumber;
            await User.update(userUpdate, { where: { id: member.userId } });
        }

        if (data.unionCellId && data.unionCellId !== oldCellId) {
            await UnionMemberHistory.create({
                unionMemberId: member.id, type: 'transfer', oldValue: oldCellId,
                newValue: data.unionCellId, note: 'Chuyển chi đoàn', performedBy: performerId
            });
        }

        if (data.roleInUnion && data.roleInUnion !== oldRole) {
            await UnionMemberHistory.create({
                unionMemberId: member.id, type: 'role_change', oldValue: oldRole,
                newValue: data.roleInUnion, performedBy: performerId
            });
            await this._syncUserSystemSpecs(member.id);
        }

        return member;
    }

    static async getProfileUpdateRequests(user, status = 'pending') {
        const scopeFilter = getScopeFilter(user, 'member');

        return await ProfileUpdateRequest.findAll({
            where: { status },
            include: [{
                model: UnionMember,
                where: scopeFilter,
                attributes: ['fullName', 'memberCode'],
                include: [{ model: UnionCell, attributes: ['name'] }]
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    static async approveProfileUpdate(requestId, adminUser) {
        const request = await ProfileUpdateRequest.findByPk(requestId);
        if (!request || request.status !== 'pending') throw new ErrorResponse('Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý', 400);

        const member = await UnionMember.findByPk(request.unionMemberId);
        if (!member) throw new ErrorResponse('Đoàn viên không còn tồn tại', 404);

        const updateData = { ...request.newData };
        console.log('[Debug-Approve] Original newData:', request.newData);

        ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
            if (updateData[field] !== undefined) {
                const cleaned = safeDate(updateData[field]);
                console.log(`[Debug-Approve] Cleaning ${field}: "${updateData[field]}" -> "${cleaned}"`);
                updateData[field] = cleaned;
            }
        });

        console.log('[Debug-Approve] Prepared updateData:', updateData);
        await member.update(updateData);

        await request.update({ status: 'approved', approvedBy: adminUser.id });

        if (request.newData.roleInUnion) {
            await this._syncUserSystemSpecs(member.id);
        }

        return { message: 'Đã phê duyệt thay đổi hồ sơ thành công', member };
    }

    static async rejectProfileUpdate(requestId, adminUser, note) {
        const request = await ProfileUpdateRequest.findByPk(requestId);
        if (!request || request.status !== 'pending') throw new ErrorResponse('Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý', 400);

        await request.update({ status: 'rejected', approvedBy: adminUser.id, note });

        return { message: 'Đã từ chối thay đổi hồ sơ' };
    }

    static async delete(id, user) {
        const member = await this.getById(id, user, true);
        await member.destroy();
        return { message: 'Đã chuyển hồ sơ đoàn viên vào thùng rác' };
    }

    static async restore(id, user) {
        const member = await this.getById(id, user, true);
        if (member.userId) {
            const userLinked = await User.findByPk(member.userId, { paranoid: false });
            if (userLinked && userLinked.deletedAt) {
                throw new ErrorResponse('Hãy khôi phục tài khoản liên kết trước.', 400);
            }
        }
        await member.restore();
        return member;
    }

    static async forceDelete(id, user) {
        const member = await this.getById(id, user, true);
        await member.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn hồ sơ đoàn viên' };
    }

    static async approve(id, user) {
        const member = await this.getById(id, user, true);
        if (member.status !== 'pending' && member.status !== 'rejected') {
            throw new ErrorResponse('Hồ sơ không ở trạng thái chờ duyệt', 400);
        }

        await member.update({ status: 'approved', approvedBy: user.id });

        await UnionMemberHistory.create({
            unionMemberId: member.id, type: 'status_change', newValue: 'approved',
            note: 'Phê duyệt hồ sơ', performedBy: user.id
        });

        await this._syncUserSystemSpecs(member.id);

        return { message: 'Đã duyệt đoàn viên thành công', data: member };
    }

    static async reject(id, user) {
        const member = await this.getById(id, user, true);
        await member.update({ status: 'rejected', approvedBy: user.id });

        await UnionMemberHistory.create({
            unionMemberId: member.id, type: 'status_change', newValue: 'rejected',
            note: 'Từ chối hồ sơ', performedBy: user.id
        });

        return { message: 'Đã từ chối đoàn viên', data: member };
    }

    static async assignPosition(memberId, positionId, { branchId, cellId, assignedDate, moveMember = false } = {}, user) {
        const member = await this.getById(memberId, user, true);
        if (member.status !== 'approved') throw new ErrorResponse('Chỉ có thể bổ nhiệm cho đoàn viên đã duyệt', 400);

        const position = await UnionPosition.findByPk(positionId);
        if (!position) throw new ErrorResponse('Không tìm thấy chức vụ', 404);

        if (!user.isSuperAdmin && position.scopeLevel === 'SCHOOL') {
            throw new ErrorResponse('Bạn không có quyền bổ nhiệm chức vụ cấp Trường', 403);
        }

        await UnionMemberPosition.update(
            { isActive: false, endedDate: new Date() },
            { where: { unionMemberId: memberId, isActive: true } }
        );

        // Kiểm tra xem đã từng giữ chức vụ này chưa (do DB có UNIQUE constraint)
        const existingPos = await UnionMemberPosition.findOne({
            where: { unionMemberId: memberId, unionPositionId: positionId }
        });

        let newPos;
        const posData = {
            unionBranchId: branchId || (position.scopeLevel === 'BRANCH' ? member.UnionCell?.unionBranchId : null),
            unionCellId: cellId || (position.scopeLevel === 'CELL' ? member.unionCellId : null),
            assignedDate: safeDate(assignedDate, new Date(), false),
            isActive: true,
            endedDate: null
        };

        if (existingPos) {
            console.log(`[Debug-Assign] Reusing existing record for member ${memberId}, position ${positionId}`);
            newPos = await existingPos.update(posData);
        } else {
            newPos = await UnionMemberPosition.create({
                unionMemberId: memberId,
                unionPositionId: positionId,
                ...posData
            });
        }

        if (moveMember) {
            const updateData = {};
            if (cellId) updateData.unionCellId = cellId;
            if (Object.keys(updateData).length > 0) {
                await member.update(updateData);
            }
        }

        let roleInUnion = 'member';
        if (position.name.includes('Bí thư') && !position.name.includes('Phó')) roleInUnion = 'secretary';
        else if (position.name.includes('Phó Bí thư')) roleInUnion = 'vice_secretary';
        else if (position.name.includes('Ủy viên')) roleInUnion = 'commissioner';

        await member.update({ roleInUnion });
        await this._syncUserSystemSpecs(member.id);

        return newPos;
    }

    static async _syncUserSystemSpecs(memberId) {
        const member = await UnionMember.findByPk(memberId, {
            include: [
                { model: User },
                {
                    model: UnionPosition,
                    through: {
                        model: UnionMemberPosition,
                        where: { isActive: true }
                    }
                },
                { model: UnionCell }
            ]
        });

        if (!member || !member.User) return;

        const user = member.User;
        const activePosition = member.UnionPositions?.[0];

        let targetRoleCode = 'MEMBER';
        let scopingBranchId = null;
        let scopingCellId = null;

        if (activePosition) {
            const isLeader = activePosition.name.includes('Bí thư');
            const isSecretary = isLeader && !activePosition.name.includes('Phó');

            if (isLeader) {
                if (activePosition.scopeLevel === 'BRANCH') targetRoleCode = 'BRANCH_ADMIN';
                else if (activePosition.scopeLevel === 'CELL') targetRoleCode = 'CELL_ADMIN';
            }

            const posPivot = activePosition.UnionMemberPosition;
            if (posPivot) {
                scopingBranchId = posPivot.unionBranchId;
                scopingCellId = posPivot.unionCellId;
            }

            if (isSecretary) {
                if (activePosition.scopeLevel === 'BRANCH' && scopingBranchId) {
                    await UnionBranch.update({ secretaryId: member.id }, { where: { id: scopingBranchId } });
                } else if (activePosition.scopeLevel === 'CELL' && scopingCellId) {
                    await UnionCell.update({ secretaryId: member.id }, { where: { id: scopingCellId } });
                }
            }
            console.log(`[Sync-Spec] Member ${member.fullName}: Role ${targetRoleCode}, Scope B:${scopingBranchId}, C:${scopingCellId}`);
        }

        const targetRole = await Role.findOne({ where: { code: targetRoleCode } });
        if (targetRole) {
            await user.setRoles([targetRole]);
        } else {
            await user.setRoles([]);
        }

        await user.update({
            unionBranchId: scopingBranchId,
            unionCellId: scopingCellId,
            role: targetRoleCode
        });
    }

    static async bulkDelete(ids, user) {
        const scopeFilter = getScopeFilter(user, 'member');
        await UnionMember.destroy({
            where: {
                id: { [Op.in]: ids },
                ...scopeFilter
            }
        });
        return { message: `Đã chuyển ${ids.length} hồ sơ vào thùng rác` };
    }

    static async bulkRestore(ids, user) {
        const scopeFilter = getScopeFilter(user, 'member');
        const members = await UnionMember.findAll({
            where: {
                id: { [Op.in]: ids },
                ...scopeFilter
            },
            paranoid: false
        });

        for (const member of members) {
            await member.restore();
        }

        return { message: `Đã khôi phục ${members.length} hồ sơ` };
    }

    static async bulkForceDelete(ids, user) {
        const scopeFilter = getScopeFilter(user, 'member');
        await UnionMember.destroy({
            where: {
                id: { [Op.in]: ids },
                ...scopeFilter
            },
            force: true,
            paranoid: false
        });
        return { message: `Đã xóa vĩnh viễn ${ids.length} hồ sơ` };
    }
}

module.exports = UnionMemberService;
