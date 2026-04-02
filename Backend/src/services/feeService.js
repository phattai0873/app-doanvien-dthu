const { UnionFeePayment, UnionMember, UnionCell, User, UnionFeeType, PaymentTransaction, sequelize, BankSetting } = require('../models');
const { Op } = require('sequelize');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/paginate');

class FeeService {
    static async getAll({ period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {
            ...(period && { period }),
            ...(memberId && { unionMemberId: memberId }),
            ...(unionFeeTypeId && { unionFeeTypeId }),
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
                const hasPaid = payments.some(p => p.unionFeeTypeId === type.id && p.period === year);
                if (!hasPaid) {
                    unpaidFees.push({
                        unionFeeTypeId: type.id,
                        name: type.name,
                        period: year,
                        amount: 24000, // Giá trị mặc định hoặc tùy chỉnh sau
                        deadline: `${year}-12-31`, // Tạm thời
                        priority: year === currentYear ? 'NORMAL' : 'OVERDUE'
                    });
                }
            }
        }

        const totalDebt = unpaidFees.reduce((sum, f) => sum + f.amount, 0);
        const nearestDeadline = unpaidFees.length > 0 ? unpaidFees.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0].deadline : null;

        const member = await UnionMember.findByPk(unionMemberId, { attributes: ['id', 'memberCode', 'fullName'] });

        return {
            summary: {
                totalDebt,
                unpaidCount: unpaidFees.length,
                pendingCount: pendingTransactions.length,
                nearestDeadline,
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

    static async create(data) {
        const { unionMemberId, unionFeeTypeId, period, amount, paymentMethod, note } = data;

        // Kiểm tra xem đã đóng chưa
        const existing = await UnionFeePayment.findOne({
            where: { unionMemberId, unionFeeTypeId, period }
        });
        if (existing) {
            throw new ErrorResponse('Đoàn viên này đã nộp loại phí này trong kỳ này rồi.', 400);
        }

        const member = await UnionMember.findByPk(unionMemberId, {
            include: [{ model: UnionCell }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        const t = await sequelize.transaction();

        try {
            // 1. Tạo Transaction
            const transaction = await PaymentTransaction.create({
                unionMemberId,
                unionFeeTypeId,
                amount,
                period,
                paymentProvider: paymentMethod || 'CASH',
                status: 'SUCCESS', // Hiện tại làm thủ công nên mặc định SUCCESS
                paidAt: new Date(),
                internalTransactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            }, { transaction: t });

            // 2. Tạo Payment record
            const payment = await UnionFeePayment.create({
                unionMemberId,
                unionFeeTypeId,
                paymentTransactionId: transaction.id,
                period,
                amount,
                paidAt: new Date(),
                note,
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

    static async getUnpaidMembers(period, { unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = {}) {
        if (!period) throw new ErrorResponse('Vui lòng cung cấp kỳ (period)', 400);
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const paidMemberIds = await UnionFeePayment.findAll({
            where: {
                period,
                ...(unionFeeTypeId && { unionFeeTypeId })
            },
            attributes: ['unionMemberId']
        }).then(r => r.map(x => x.unionMemberId));

        const whereId = paidMemberIds.length
            ? { id: { [Op.notIn]: paidMemberIds } }
            : {};

        const memberWhere = {
            ...whereId,
            ...(unionCellId && { unionCellId }),
            ...(search && {
                [Op.or]: [
                    { fullName: { [Op.iLike]: `%${search}%` } },
                    { memberCode: { [Op.iLike]: `%${search}%` } }
                ]
            })
        };

        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'unionBranchId']
        };

        if (unionBranchId) {
            cellInclude.where = { unionBranchId };
        }

        const result = await UnionMember.findAndCountAll({
            where: {
                ...memberWhere
            },
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

    static async update(id, data) {
        const payment = await UnionFeePayment.findByPk(id);
        if (!payment) throw new ErrorResponse('Không tìm thấy bản ghi', 404);

        // Chỉ cho phép update một số trường nhất định
        const { amount, note, paidAt } = data;
        return await payment.update({ amount, note, paidAt });
    }

    static async delete(id) {
        const payment = await UnionFeePayment.findByPk(id);
        if (!payment) throw new ErrorResponse('Không tìm thấy bản ghi', 404);

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

    static async initPayment(data) {
        const { unionMemberId, unionFeeTypeId, period, amount, paymentProvider, evidenceImageUrl, note } = data;

        // 1. Kiểm tra xem đã đóng hoặc đã có giao dịch PENDING cho kỳ này chưa
        const existingPayment = await UnionFeePayment.findOne({ where: { unionMemberId, unionFeeTypeId, period } });
        if (existingPayment) throw new ErrorResponse('Khoản phí này đã được ghi nhận hoàn thành.', 400);

        const existingPending = await PaymentTransaction.findOne({ where: { unionMemberId, unionFeeTypeId, period, status: 'PENDING' } });
        if (existingPending) throw new ErrorResponse('Bạn đã gửi yêu cầu thanh toán cho khoản này. Vui lòng đợi Admin duyệt.', 400);

        // 2. Tạo Transaction PENDING
        return await PaymentTransaction.create({
            unionMemberId,
            unionFeeTypeId,
            amount,
            period,
            paymentProvider: paymentProvider || 'BANK_TRANSFER',
            status: 'PENDING',
            evidenceImageUrl,
            note,
            internalTransactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
    }

    static async approveTransaction(id) {
        const transaction = await PaymentTransaction.findByPk(id);
        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        const member = await UnionMember.findByPk(transaction.unionMemberId, {
            include: [{ model: UnionCell }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên gắn với giao dịch này', 404);

        const t = await sequelize.transaction();
        try {
            // 1. Update Transaction status
            await transaction.update({
                status: 'SUCCESS',
                paidAt: new Date(),
            }, { transaction: t });

            // 2. Create Payment record
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

    static async rejectTransaction(id, reason = 'Thông tin thanh toán không hợp lệ') {
        const transaction = await PaymentTransaction.findByPk(id);
        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        return await transaction.update({
            status: 'FAILED',
            note: `${transaction.note || ''} (Từ chối: ${reason})`
        });
    }

    static async getPendingTransactions(unionBranchId = null) {
        const where = { status: 'PENDING' };

        const include = [
            {
                model: UnionMember,
                attributes: ['id', 'fullName', 'memberCode', 'unionBranchId']
            },
            { model: UnionFeeType, attributes: ['id', 'name'] }
        ];

        if (unionBranchId) {
            include[0].where = { unionBranchId };
        }

        return await PaymentTransaction.findAll({
            where,
            include,
            order: [['createdAt', 'DESC']]
        });
    }

    static async getBankSetting() {
        let setting = await BankSetting.findOne({ where: { isDefault: true } });
        if (!setting) {
            // Tạo bản ghi mặc định nếu chưa có
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
        if (setting) {
            return await setting.update(data);
        } else {
            return await BankSetting.create({ ...data, isDefault: true });
        }
    }
}

module.exports = FeeService;
