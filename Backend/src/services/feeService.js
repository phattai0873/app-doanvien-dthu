const { 
    UnionFeePayment, UnionMember, UnionCell, User, UnionFeeType, PaymentTransaction, sequelize, BankSetting,
    FeeCollection, FeeItem, FeeCollectionScope, FeePayment, UnionBranch
} = require('../models');
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
     * Dashboard tài chính cá nhân (New Enterprise Architecture)
     */
    static async getMyFeeDashboard(unionMemberId) {
        const member = await UnionMember.findByPk(unionMemberId, {
            include: [{ model: UnionCell, attributes: ['id', 'unionBranchId'] }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy thông tin đoàn viên', 404);

        const cellId = member.unionCellId;
        const branchId = member.UnionCell?.unionBranchId;

        // 1. Tìm các Collection phù hợp với Member (Scoping OR logic)
        const applicableScopes = await FeeCollectionScope.findAll({
            where: {
                [Op.or]: [
                    { scopeType: 'ALL' },
                    { [Op.and]: [{ scopeType: 'BRANCH' }, { scopeId: branchId }] },
                    { [Op.and]: [{ scopeType: 'CELL' }, { scopeId: cellId }] }
                ]
            },
            attributes: ['feeCollectionId']
        });

        const collectionIds = [...new Set(applicableScopes.map(s => s.feeCollectionId))];

        // 2. Lấy dữ liệu Collection -> Items -> Payments
        const collections = await FeeCollection.findAll({
            where: { 
                id: { [Op.in]: collectionIds },
                isActive: true
            },
            include: [
                {
                    model: FeeItem,
                    as: 'Items',
                    attributes: ['id', 'label', 'period', 'amount', 'deadline'],
                    include: [
                        {
                            model: FeePayment,
                            where: { unionMemberId },
                            required: false,
                            include: [{ 
                                model: PaymentTransaction, 
                                attributes: ['id', 'status', 'paymentProvider', 'evidenceImageUrl']
                            }]
                        }
                    ]
                },
                { model: UnionFeeType, attributes: ['id', 'name'] }
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: FeeItem, as: 'Items' }, 'period', 'ASC']
            ]
        });

        // 3. Tính toán Summary
        let totalDebt = 0;
        let unpaidCount = 0;
        let pendingCount = 0;
        let nearestDeadline = null;

        const processedCollections = collections.map(col => {
            const items = col.Items.map(item => {
                const payment = item.FeePayments?.[0]; // User chỉ có tối đa 1 payment cho 1 item (unique constraint)
                const status = payment ? payment.status : 'UNPAID';
                
                if (status === 'UNPAID' || status === 'REJECTED' || status === 'OVERDUE') {
                    totalDebt += Number(item.amount);
                    unpaidCount++;
                    if (!nearestDeadline || (item.deadline && new Date(item.deadline) < new Date(nearestDeadline))) {
                        nearestDeadline = item.deadline;
                    }
                } else if (status === 'PENDING') {
                    pendingCount++;
                }

                return {
                    id: item.id,
                    label: item.label,
                    period: item.period,
                    amount: Number(item.amount),
                    deadline: item.deadline,
                    status,
                    payment: payment ? {
                        id: payment.id,
                        paidAt: payment.paidAt,
                        status: payment.status,
                        amountSnapshot: payment.amountSnapshot,
                        transaction: payment.PaymentTransaction
                    } : null
                };
            });

            return {
                id: col.id,
                name: col.name,
                feeType: col.UnionFeeType?.name,
                periodType: col.periodType,
                allowPartialPayment: col.allowPartialPayment,
                items
            };
        });

        return {
            summary: {
                totalDebt,
                unpaidCount,
                pendingCount,
                nearestDeadline,
                memberCode: member.memberCode,
                fullName: member.fullName
            },
            collections: processedCollections
        };
    }

    /**
     * Tạo bản ghi nộp phí thủ công (Admin)
     */
    static async create(data, user) {
        const { targetType, unionMemberId, unionCellId, unionBranchId, paymentMethod, note, evidenceImageUrl, deadline } = data;
        const amount = Number(data.amount || 0);
        const period = data.period ? String(data.period) : new Date().getFullYear().toString();
        const unionFeeTypeId = data.unionFeeTypeId === '' ? null : data.unionFeeTypeId;

        let targetMemberIds = [];

        if (targetType === 'ALL' || targetType === 'SCHOOL') {
            const members = await UnionMember.findAll({ where: { status: 'approved', activityStatus: 'active' } });
            targetMemberIds = members.map(m => m.id);
        } else if (targetType === 'CELL' || unionCellId) {
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
                    deadline,
                    internalTransactionId: `TXN-MANUAL-${Date.now()}-${mId.substring(0,4)}`
                }, { transaction: t });

                const payment = await UnionFeePayment.create({
                    unionMemberId: mId,
                    unionFeeTypeId,
                    paymentTransactionId: transaction.id,
                    period,
                    amount,
                    paidAt: new Date(),
                    deadline,
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
            status: 'approved',
            activityStatus: 'active',
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

        const bIdForFilter = unionBranchId || ( !user.isSuperAdmin ? (user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId) : null );
        
        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'unionBranchId'],
            required: !!(bIdForFilter || unionCellId || !user.isSuperAdmin) // Bắt buộc join nếu có lọc hoặc không phải superadmin
        };

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
     * KHỞI TẠO THANH TOÁN (Mobile) - Hỗ trợ nộp nhiều Item cùng lúc
     */
    static async initPayment(data, user) {
        const { feeItemIds, paymentProvider, evidenceImageUrl, note, transactionCode } = data;
        const unionMemberId = user.UnionMember?.id || user.unionMemberId;

        if (!unionMemberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);
        if (!feeItemIds || !Array.isArray(feeItemIds) || feeItemIds.length === 0) {
            throw new ErrorResponse('Vui lòng chọn ít nhất một khoản phí để thanh toán', 400);
        }

        // 1. Kiểm tra Idempotency (transactionCode)
        if (transactionCode) {
            const existingTx = await PaymentTransaction.findOne({ where: { transactionCode } });
            if (existingTx) return existingTx; // Trả về giao dịch đã tồn tại nếu trùng code
        }

        const t = await sequelize.transaction();

        try {
            // 2. Kiểm tra và lấy danh sách FeeItem
            const items = await FeeItem.findAll({
                where: { id: { [Op.in]: feeItemIds } },
                include: [{ model: FeeCollection }]
            });

            if (items.length !== feeItemIds.length) {
                throw new ErrorResponse('Một số khoản phí không tồn tại hoặc đã bị xóa', 404);
            }

            // 3. Kiểm tra trạng thái từng Item (đã đóng chưa?)
            const existingPayments = await FeePayment.findAll({
                where: { 
                    unionMemberId, 
                    feeItemId: { [Op.in]: feeItemIds },
                    status: { [Op.in]: ['PAID', 'PENDING'] }
                }
            });

            if (existingPayments.length > 0) {
                throw new ErrorResponse('Một hoặc nhiều khoản phí bạn chọn đang được xử lý hoặc đã thanh toán thành công', 400);
            }

            // 4. Tính tổng tiền
            const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
            const finalTransactionCode = transactionCode || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // 5. Tạo PaymentTransaction
            const transaction = await PaymentTransaction.create({
                unionMemberId,
                amount: totalAmount, // Giữ để tương thích cũ
                totalAmount,
                paymentProvider: paymentProvider || 'BANK_TRANSFER',
                status: 'PENDING',
                evidenceImageUrl,
                note,
                transactionCode: finalTransactionCode,
                internalTransactionId: finalTransactionCode // Đồng bộ mã
            }, { transaction: t });

            // 6. Tạo các FeePayment ở trạng thái PENDING
            const paymentRecords = items.map(item => ({
                unionMemberId,
                feeItemId: item.id,
                paymentTransactionId: transaction.id,
                status: 'PENDING',
                amountSnapshot: item.amount,
                note: `Thanh toán cho ${item.label} - ${item.FeeCollection?.name || ''}`
            }));

            await FeePayment.bulkCreate(paymentRecords, { transaction: t });

            await t.commit();
            return transaction;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Admin: Duyệt giao dịch (Enterprise Architecture)
     */
    static async approveTransaction(id, user) {
        const transaction = await PaymentTransaction.findByPk(id, {
            include: [
                { model: UnionMember, attributes: ['id', 'unionCellId'] },
                { model: FeePayment, as: 'Payments' }
            ]
        });

        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        // 1. Kiểm tra Scope của Admin đối với Member
        if (!transaction.UnionMember) throw new ErrorResponse('Không tìm thấy hồ sơ đoàn viên gắn với giao dịch', 404);
        enforceScope(user, transaction.UnionMember);

        const t = await sequelize.transaction();

        try {
            // 2. Cập nhật trạng thái Transaction
            await transaction.update({ 
                status: 'SUCCESS', 
                paidAt: new Date(),
                approvedBy: user.id // Ghi nhận người duyệt
            }, { transaction: t });

            // 3. Cập nhật tất cả FeePayment liên quan thành PAID
            if (transaction.Payments && transaction.Payments.length > 0) {
                await FeePayment.update(
                    { status: 'PAID', paidAt: new Date() },
                    { 
                        where: { paymentTransactionId: transaction.id },
                        transaction: t 
                    }
                );
            } else {
                // Fallback cho dữ liệu cũ (nếu Admin duyệt giao dịch cũ chưa có FeePayment)
                // Chúng ta sẽ tạo bản ghi UnionFeePayment (Legacy support) hoặc chuyển đổi tại đây
                const member = await UnionMember.findByPk(transaction.unionMemberId, { include: [UnionCell] });
                await UnionFeePayment.create({
                    unionMemberId: transaction.unionMemberId,
                    unionFeeTypeId: transaction.unionFeeTypeId,
                    paymentTransactionId: transaction.id,
                    period: transaction.period,
                    amount: transaction.amount,
                    paidAt: new Date(),
                    note: transaction.note || 'Duyệt từ Chuyển khoản (Legacy)',
                    unionCellId: member.unionCellId,
                    unionBranchId: member.UnionCell?.unionBranchId
                }, { transaction: t });
            }

            await t.commit();
            return { success: true, message: 'Giao dịch đã được duyệt thành công' };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Admin: Từ chối giao dịch
     */
    static async rejectTransaction(id, reason = 'Thông tin thanh toán không hợp lệ', user) {
        const transaction = await PaymentTransaction.findByPk(id, {
            include: [{ model: UnionMember, attributes: ['id', 'unionCellId'] }]
        });
        if (!transaction) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
        if (transaction.status !== 'PENDING') throw new ErrorResponse('Giao dịch này đã được xử lý trước đó', 400);

        // Kiểm tra scope
        enforceScope(user, transaction.UnionMember);

        const t = await sequelize.transaction();
        try {
            await transaction.update({
                status: 'FAILED',
                note: `${transaction.note || ''} (Từ chối: ${reason})`,
                approvedBy: user.id
            }, { transaction: t });

            // Cập nhật các FeePayment liên quan thành REJECTED hoặc UNPAID
            await FeePayment.update(
                { status: 'REJECTED' },
                { where: { paymentTransactionId: transaction.id }, transaction: t }
            );

            await t.commit();
            return { success: true };
        } catch (error) {
            await t.rollback();
            throw error;
        }
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

    /**
     * Admin: Lấy danh sách đợt thu phí (Enterprise Architecture)
     */
    static async getCollections(query = {}) {
        const { page, limit, search, feeTypeId, isActive } = query;
        const { limit: l, offset } = getPagination(page, limit);

        const where = {};
        if (search) where.name = { [Op.like]: `%${search}%` };
        if (feeTypeId) where.feeTypeId = feeTypeId;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const { count, rows } = await FeeCollection.findAndCountAll({
            where,
            limit: l,
            offset,
            include: [
                { model: UnionFeeType, attributes: ['id', 'name'] },
                { model: FeeItem, as: 'Items', attributes: ['id', 'label', 'period', 'amount'] }
            ],
            distinct: true,
            order: [['createdAt', 'DESC']]
        });

        return formatPaginatedResponse({ count, rows }, page, l);
    }

    /**
     * TẠO ĐỢT THU PHÍ MỚI (Enterprise Logic)
     */
    static async createCollection(data, user) {
        const { 
            name, feeTypeId, periodType, amountPerUnit, 
            periodStart, periodEnd, deadline, 
            allowPartialPayment, scopes, documentUrl 
        } = data;

        const t = await sequelize.transaction();

        try {
            // 1. Tạo Collection
            const collection = await FeeCollection.create({
                name, feeTypeId, periodType, amountPerUnit,
                periodStart, periodEnd, deadline,
                allowPartialPayment: allowPartialPayment !== false,
                documentUrl
            }, { transaction: t });

            // 2. Tạo Scopes
            if (scopes && scopes.length > 0) {
                for (const scope of scopes) {
                    await FeeCollectionScope.create({
                        feeCollectionId: collection.id,
                        scopeType: scope.type, // BRANCH, CELL, ALL
                        scopeId: scope.id
                    }, { transaction: t });
                }
            } else {
                // Mặc định là TOÀN TRƯỜNG nếu không truyền scope
                await FeeCollectionScope.create({
                    feeCollectionId: collection.id,
                    scopeType: 'ALL',
                    scopeId: null
                }, { transaction: t });
            }

            // 3. Tự động sinh FeeItems
            const year = periodStart ? new Date(periodStart).getFullYear() : new Date().getFullYear();
            let items = [];

            if (periodType === 'YEAR') {
                // Sinh 12 tháng
                for (let i = 1; i <= 12; i++) {
                    const monthStr = i < 10 ? `0${i}` : `${i}`;
                    items.push({
                        feeCollectionId: collection.id,
                        label: `Tháng ${monthStr}`,
                        period: `${year}-${monthStr}`,
                        amount: amountPerUnit,
                        deadline: deadline // Có thể cải tiến để deadline tăng dần theo tháng
                    });
                }
            } else if (periodType === 'MONTH') {
                items.push({
                    feeCollectionId: collection.id,
                    label: name,
                    period: periodStart ? periodStart.substring(0, 7) : `${year}-01`,
                    amount: amountPerUnit,
                    deadline: deadline
                });
            } else if (periodType === 'CUSTOM' && data.customItems) {
                // Sử dụng danh sách item tùy chỉnh từ Admin
                for (const ci of data.customItems) {
                    items.push({
                        feeCollectionId: collection.id,
                        label: ci.label,
                        period: ci.period || `${year}-custom`,
                        amount: ci.amount || amountPerUnit,
                        deadline: ci.deadline || deadline
                    });
                }
            }

            if (items.length > 0) {
                await FeeItem.bulkCreate(items, { transaction: t });
            }

            await t.commit();
            return collection;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = FeeService;
