const { UnionFeePayment, UnionMember, UnionCell, User, UnionFeeType, PaymentTransaction, sequelize, BankSetting } = require('../models');
const { Op } = require('sequelize');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/paginate');
const { getScopeFilter, enforceScope } = require('../utils/permissionHelper');

class FeeService {
    /**
     * Lấy danh sách nộp phí (Enterprise Scoping)
     */
    static async getAll({ period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit, user } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        const scopeFilter = getScopeFilter(user, 'fee');

        const where = {
            ...scopeFilter,
            ...(period && { period }),
            ...(memberId && { unionMemberId: memberId }),
            ...(unionFeeTypeId && { unionFeeTypeId }),
            // Ưu tiên lọc cụ thể nếu có quyền
            ...(unionCellId && { unionCellId }),
            ...(unionBranchId && { unionBranchId })
        };

        const include = [
            {
                model: UnionMember,
                attributes: ['id', 'fullName', 'memberCode', 'unionCellId'],
                include: [{ model: UnionCell, attributes: ['id', 'name'] }]
            },
            { model: UnionFeeType, attributes: ['id', 'name'] },
            { model: PaymentTransaction, attributes: ['id', 'paymentProvider', 'status', 'gatewayTransactionId'] }
        ];

        const result = await UnionFeePayment.findAndCountAll({
            where,
            include,
            order: [['paidAt', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    /**
     * Dashboard cá nhân (Mobile)
     */
    static async getMyFeeDashboard(unionMemberId) {
        const currentYear = new Date().getFullYear().toString();
        const yearsToCheck = [currentYear, (parseInt(currentYear) - 1).toString()];

        const feeTypes = await UnionFeeType.findAll({ where: { isActive: true } });
        const payments = await UnionFeePayment.findAll({
            where: { unionMemberId },
            include: [{ model: UnionFeeType, attributes: ['id', 'name'] }, { model: PaymentTransaction, attributes: ['id', 'status', 'paymentProvider'] }],
            order: [['paidAt', 'DESC']]
        });

        const pendingTransactions = await PaymentTransaction.findAll({
            where: { unionMemberId, status: 'PENDING' },
            include: [{ model: UnionFeeType, attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });

        const unpaidFees = [];
        for (const type of feeTypes) {
            for (const year of yearsToCheck) {
                const hasPaid = payments.some(p => (p.unionFeeTypeId === type.id || p.UnionFeeType?.id === type.id) && p.period === year);
                const hasPending = pendingTransactions.some(t => (t.unionFeeTypeId === type.id || t.UnionFeeType?.id === type.id) && t.period === year);
                
                if (!hasPaid && !hasPending) {
                    unpaidFees.push({
                        unionFeeTypeId: type.id,
                        name: type.name,
                        period: year,
                        amount: 24000,
                        deadline: `${year}-12-31`,
                        priority: year === currentYear ? 'NORMAL' : 'OVERDUE'
                    });
                }
            }
        }

        const member = await UnionMember.findByPk(unionMemberId, { attributes: ['id', 'memberCode', 'fullName'] });

        return {
            summary: {
                totalDebt: unpaidFees.reduce((sum, f) => sum + f.amount, 0),
                unpaidCount: unpaidFees.length,
                pendingCount: pendingTransactions.length,
                memberCode: member?.memberCode,
                fullName: member?.fullName
            },
            unpaidFees,
            pendingTransactions: pendingTransactions.map(t => ({
                ...t.toJSON ? t.toJSON() : t,
                evidenceImageUrl: t.evidenceImageUrl ? `${process.env.BASE_URL || ''}/uploads/fees/${t.evidenceImageUrl.split('/').pop()}` : null
            })),
            history: payments
        };
    }

    /**
     * Tạo bản ghi nộp phí thủ công (Admin)
     */
    static async create(data, user) {
        const { targetType, unionMemberId, unionCellId, unionBranchId, paymentMethod, note, evidenceImageUrl } = data;
        const amount = Number(data.amount || 0);
        const period = data.period ? String(data.period) : new Date().getFullYear().toString();
        const unionFeeTypeId = data.unionFeeTypeId === '' ? null : data.unionFeeTypeId;

        let targetMemberIds = [];

        if (targetType === 'CELL' || unionCellId) {
            const id = unionCellId || data.targetId;
            const members = await UnionMember.findAll({ where: { unionCellId: id } });
            targetMemberIds = members.map(m => m.id);
        } else if (targetType === 'BRANCH' || unionBranchId) {
            const id = unionBranchId || data.targetId;
            const members = await UnionMember.findAll({
                include: [{ model: UnionCell, where: { unionBranchId: id } }]
            });
            targetMemberIds = members.map(m => m.id);
        } else if (targetType === 'MEMBER_LIST' || data.memberIds) {
            targetMemberIds = Array.isArray(data.memberIds) ? data.memberIds : (typeof data.memberIds === 'string' ? data.memberIds.split(',') : []);
        } else {
            targetMemberIds = [unionMemberId];
        }

        if (targetMemberIds.length === 0) throw new ErrorResponse('Không tìm thấy đoàn viên nào trong phạm vi đã chọn', 404);

        // Lọc những người đã nộp rồi để tránh trùng lặp
        const paidMemberIds = await UnionFeePayment.findAll({
            where: { 
                unionMemberId: { [Op.in]: targetMemberIds },
                unionFeeTypeId,
                period
            },
            attributes: ['unionMemberId']
        }).then(r => r.map(x => x.unionMemberId));

        const pendingMemberIds = targetMemberIds.filter(id => !paidMemberIds.includes(id));

        if (pendingMemberIds.length === 0) {
            throw new ErrorResponse('Tất cả đoàn viên trong đơn vị này đã nộp loại phí này rồi.', 400);
        }

        const t = await sequelize.transaction();

        try {
            const results = [];
            for (const mId of pendingMemberIds) {
                const member = await UnionMember.findByPk(mId, { include: [UnionCell] });
                
                const transaction = await PaymentTransaction.create({
                    unionMemberId: mId,
                    unionFeeTypeId,
                    amount,
                    period,
                    paymentProvider: paymentMethod || 'CASH',
                    status: 'SUCCESS',
                    paidAt: new Date(),
                    evidenceImageUrl,
                    internalTransactionId: `TXN-MANUAL-${Date.now()}-${mId.substring(0,4)}`
                }, { transaction: t });

                const payment = await UnionFeePayment.create({
                    unionMemberId: mId,
                    unionFeeTypeId,
                    paymentTransactionId: transaction.id,
                    period,
                    amount,
                    paidAt: new Date(),
                    note: note || (pendingMemberIds.length > 1 ? `Ghi nhận hàng loạt cho đơn vị` : ''),
                    evidenceImageUrl,
                    unionCellId: member.unionCellId,
                    unionBranchId: member.UnionCell?.unionBranchId
                }, { transaction: t });
                
                results.push(payment);
            }

            await t.commit();
            return { count: results.length, message: `Đã ghi nhận nộp phí cho ${results.length} đoàn viên.` };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Danh sách chưa nộp phí (Strict Scoping)
     */
    static async getUnpaidMembers(period, { unionCellId, unionBranchId, unionFeeTypeId, search, page, limit, user } = {}) {
        if (!period) throw new ErrorResponse('Vui lòng cung cấp kỳ (period)', 400);
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Lọc theo Scope của Admin dựa trên bản ghi đóng phí
        const scopeFilter = getScopeFilter(user, 'fee');

        const paidMemberIds = await UnionFeePayment.findAll({
            where: {
                period,
                ...(unionFeeTypeId && { unionFeeTypeId }),
                ...scopeFilter
            },
            attributes: ['unionMemberId']
        }).then(r => r.map(x => x.unionMemberId));

        const memberWhere = {
            id: { [Op.notIn]: paidMemberIds },
            ...(unionCellId && { unionCellId }),
            ...(search && {
                [Op.or]: [
                    { fullName: { [Op.iLike]: `%${search}%` } },
                    { memberCode: { [Op.iLike]: `%${search}%` } }
                ]
            })
        };

        // Thủ công Scoping cho UnionMember
        if (!user.isSuperAdmin) {
            const bId = user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId;
            const cId = user.unionCellId || user.scope?.cellId || user.UnionMember?.unionCellId;

            if (cId) {
                memberWhere.unionCellId = cId;
            } else if (bId) {
                // Sẽ được lọc qua cellInclude.where bên dưới
            } else {
                return [];
            }
        }

        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'unionBranchId'],
            required: !user.isSuperAdmin // Bắt buộc join nếu không phải superadmin
        };

        const bIdForFilter = unionBranchId || ( !user.isSuperAdmin ? (user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId) : null );
        if (bIdForFilter) {
            cellInclude.where = { unionBranchId: bIdForFilter };
        }

        const result = await UnionMember.findAndCountAll({
            where: memberWhere,
            include: [
                cellInclude,
                { model: User, attributes: ['id', 'email', 'phoneNumber'] }
            ],
            attributes: ['id', 'fullName', 'memberCode'],
            order: [['fullName', 'ASC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async update(id, data, user) {
        const payment = await UnionFeePayment.findByPk(id);
        if (!payment) throw new ErrorResponse('Không tìm thấy bản ghi', 404);

        // 1. Kiểm tra scope
        enforceScope(user, payment);

        const { amount, note, paidAt } = data;
        return await payment.update({ amount, note, paidAt });
    }

    static async delete(id, user) {
        const payment = await UnionFeePayment.findByPk(id);
        if (!payment) throw new ErrorResponse('Không tìm thấy bản ghi', 404);

        // 1. Kiểm tra scope
        enforceScope(user, payment);

        const t = await sequelize.transaction();
        try {
            if (payment.paymentTransactionId) {
                await PaymentTransaction.destroy({ where: { id: payment.paymentTransactionId }, transaction: t });
            }
            await payment.destroy({ transaction: t });
            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Mobile: Gửi yêu cầu thanh toán (Scoping qua User Session)
     */
    static async initPayment(data, user) {
        const { unionFeeTypeId, paymentProvider, evidenceImageUrl, note } = data;
        const amount = Number(data.amount || 0);
        const period = String(data.period || new Date().getFullYear());
        const unionMemberId = user.UnionMember?.id || user.unionMemberId;

        if (!unionMemberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const existingPayment = await UnionFeePayment.findOne({ where: { unionMemberId, unionFeeTypeId, period } });
        if (existingPayment) throw new ErrorResponse('Khoản phí này đã được ghi nhận hoàn thành.', 400);

        const existingPending = await PaymentTransaction.findOne({ where: { unionMemberId, unionFeeTypeId, period, status: 'PENDING' } });
        if (existingPending) throw new ErrorResponse('Bạn đã gửi yêu cầu thanh toán cho khoản này. Vui lòng đợi Admin duyệt.', 400);

        return await PaymentTransaction.create({
            unionMemberId,
            unionFeeTypeId,
            amount,
            period,
            paymentProvider: paymentProvider || 'BANK_TRANSFER',
            status: 'PENDING',
            evidenceImageUrl,
            note,
            internalTransactionId: `TXN-${Date.now()}`
        });
    }

    /**
     * Admin: Duyệt giao dịch (Strict Scoping)
     */
    static async approveTransaction(id, user) {
        const transaction = await PaymentTransaction.findByPk(id, {
            include: [{ model: UnionMember, attributes: ['id', 'unionCellId'] }]
        });
        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        // 1. Kiểm tra Scope của Member liên quan đến transaction
        if (!transaction.UnionMember) throw new ErrorResponse('Không tìm thấy hồ sơ đoàn viên gắn với giao dịch', 404);
        enforceScope(user, transaction.UnionMember);

        const member = await UnionMember.findByPk(transaction.unionMemberId, { include: [{ model: UnionCell }] });

        const t = await sequelize.transaction();
        try {
            await transaction.update({ status: 'SUCCESS', paidAt: new Date() }, { transaction: t });

            const payment = await UnionFeePayment.create({
                unionMemberId: transaction.unionMemberId,
                unionFeeTypeId: transaction.unionFeeTypeId,
                paymentTransactionId: transaction.id,
                period: transaction.period,
                amount: transaction.amount,
                paidAt: new Date(),
                note: transaction.note || 'Duyệt từ Chuyển khoản',
                unionCellId: member.unionCellId,
                unionBranchId: member.UnionCell?.unionBranchId
            }, { transaction: t });

            await t.commit();
            return payment;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async rejectTransaction(id, reason = 'Thông tin thanh toán không hợp lệ', user) {
        const transaction = await PaymentTransaction.findByPk(id, {
            include: [{ model: UnionMember, attributes: ['id', 'unionCellId'] }]
        });
        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        // Kiểm tra scope
        enforceScope(user, transaction.UnionMember);

        return await transaction.update({
            status: 'FAILED',
            note: `${transaction.note || ''} (Từ chối: ${reason})`
        });
    }

    /**
     * Duyệt hàng loạt giao dịch
     */
    static async bulkApproveTransactions(ids, user) {
        if (!ids || !ids.length) return { success: true, count: 0 };
        let count = 0;
        for (const id of ids) {
            try {
                await this.approveTransaction(id, user);
                count++;
            } catch (err) {
                console.error(`Bulk Approve fail for ${id}:`, err.message);
            }
        }
        return { count };
    }

    /**
     * Từ chối hàng loạt giao dịch
     */
    static async bulkRejectTransactions(ids, reason, user) {
        if (!ids || !ids.length) return { success: true, count: 0 };
        let count = 0;
        for (const id of ids) {
            try {
                await this.rejectTransaction(id, reason, user);
                count++;
            } catch (err) {
                console.error(`Bulk Reject fail for ${id}:`, err.message);
            }
        }
        return { count };
    }

    /**
     * Admin: Lấy danh sách chờ duyệt (Enterprise Scoping)
     */
    static async getPendingTransactions(user) {
        const where = { status: 'PENDING' };
        let memberWhere = {};
        let cellWhere = {};

        // Thủ công Scoping tường minh theo từng cấp association
        if (!user.isSuperAdmin) {
            const branchId = user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId;
            const cellId = user.unionCellId || user.scope?.cellId || user.UnionMember?.unionCellId;

            if (cellId) {
                memberWhere.unionCellId = cellId;
            } else if (branchId) {
                cellWhere.unionBranchId = branchId;
            } else {
                return [];
            }
        }

        return await PaymentTransaction.findAll({
            where,
            include: [
                {
                    model: UnionMember,
                    where: Object.keys(memberWhere).length ? memberWhere : undefined,
                    required: true,
                    attributes: ['id', 'fullName', 'memberCode', 'unionCellId'],
                    include: [
                        { 
                            model: UnionCell, 
                            where: Object.keys(cellWhere).length ? cellWhere : undefined,
                            required: true,
                            attributes: ['id', 'name', 'unionBranchId'] 
                        }
                    ]
                },
                { model: UnionFeeType, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
    }

    static async getBankSetting() {
        let setting = await BankSetting.findOne({ where: { isDefault: true } });
        if (!setting) {
            setting = await BankSetting.create({
                bankId: 'MB',
                bankName: 'MB Bank (Quân Đội)',
                accountNo: '0383123456',
                accountName: 'DOAN THANH NIEN DTHU',
                isDefault: true
            });
        }
        return setting;
    }

    static async updateBankSetting(data) {
        let setting = await BankSetting.findOne({ where: { isDefault: true } });
        if (setting) return await setting.update(data);
        return await BankSetting.create({ ...data, isDefault: true });
    }
}

module.exports = FeeService;
