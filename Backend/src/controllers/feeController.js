const asyncHandler = require('../utils/asyncHandler');
const FeeService = require('../services/feeService');

const feeController = {
    getFees: asyncHandler(async (req, res) => {
        let { period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = req.query;
        
        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getAll({ period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getMyFeeDashboard: asyncHandler(async (req, res) => {
        const memberId = req.user?.UnionMember?.id;
        if (!memberId) {
            throw new ErrorResponse('Tài khoản này chưa liên kết với thông tin đoàn viên', 400);
        }

        const dashboard = await FeeService.getMyFeeDashboard(memberId);
        res.status(200).json({ success: true, data: dashboard });
    }),

    createFee: asyncHandler(async (req, res) => {
        const fee = await FeeService.create(req.body);
        res.status(201).json({ success: true, data: fee });
    }),

    getUnpaidMembers: asyncHandler(async (req, res) => {
        let { period, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = req.query;

        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getUnpaidMembers(period, { unionCellId, unionBranchId, unionFeeTypeId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    deleteFee: asyncHandler(async (req, res) => {
        const result = await FeeService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    updateFee: asyncHandler(async (req, res) => {
        const fee = await FeeService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: fee });
    }),

    initPayment: asyncHandler(async (req, res) => {
        const memberId = req.user?.UnionMember?.id;
        if (!memberId) throw new ErrorResponse('Tài khoản này chưa liên kết với thông tin đoàn viên', 400);

        const data = {
            ...req.body,
            unionMemberId: memberId,
            evidenceImageUrl: req.file ? req.file.path : null
        };

        const result = await FeeService.initPayment(data);
        res.status(201).json({ success: true, data: result });
    }),

    getPendingTransactions: asyncHandler(async (req, res) => {
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;
        let branchId = null;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            branchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getPendingTransactions(branchId);
        res.status(200).json({ success: true, data: result });
    }),

    approveTransaction: asyncHandler(async (req, res) => {
        const result = await FeeService.approveTransaction(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    rejectTransaction: asyncHandler(async (req, res) => {
        const { reason } = req.body;
        const result = await FeeService.rejectTransaction(req.params.id, reason);
        res.status(200).json({ success: true, data: result });
    }),

    getBankSetting: asyncHandler(async (req, res) => {
        const result = await FeeService.getBankSetting();
        res.status(200).json({ success: true, data: result });
    }),

    updateBankSetting: asyncHandler(async (req, res) => {
        const result = await FeeService.updateBankSetting(req.body);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = feeController;
