const asyncHandler = require('../utils/asyncHandler');
const FeeService = require('../services/feeService');
const ErrorResponse = require('../utils/errorResponse');

const feeController = {
    /**
     * Admin: Lấy danh sách nộp phí (Scoping)
     */
    getFees: asyncHandler(async (req, res) => {
        const { period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = req.query;
        
        const result = await FeeService.getAll({ 
            period, memberId, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit,
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    /**
     * Mobile: Dashboard cá nhân
     */
    getMyFeeDashboard: asyncHandler(async (req, res) => {
        const memberId = req.user?.UnionMember?.id || req.user.unionMemberId;
        
        if (!memberId) {
            return res.status(200).json({ 
                success: true, 
                data: {
                    summary: { totalDebt: 0, unpaidCount: 0, pendingCount: 0, memberCode: 'N/A', fullName: req.user.username },
                    unpaidFees: [],
                    pendingTransactions: [],
                    history: []
                } 
            });
        }

        const dashboard = await FeeService.getMyFeeDashboard(memberId);
        res.status(200).json({ success: true, data: dashboard });
    }),

    /**
     * Admin: Ghi nộp phí thủ công
     */
    createFee: asyncHandler(async (req, res) => {
        const fee = await FeeService.create(req.body, req.user);
        res.status(201).json({ success: true, data: fee });
    }),

    /**
     * Admin: Danh sách chưa nộp phí (Scoping)
     */
    getUnpaidMembers: asyncHandler(async (req, res) => {
        const { period, unionCellId, unionBranchId, unionFeeTypeId, search, page, limit } = req.query;

        const result = await FeeService.getUnpaidMembers(period, { 
            unionCellId, unionBranchId, unionFeeTypeId, search, page, limit,
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    deleteFee: asyncHandler(async (req, res) => {
        const result = await FeeService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    updateFee: asyncHandler(async (req, res) => {
        const fee = await FeeService.update(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: fee });
    }),

    /**
     * Mobile: Gửi yêu cầu nộp phí (Chuyển khoản)
     */
    initPayment: asyncHandler(async (req, res) => {
        const result = await FeeService.initPayment({
            ...req.body,
            evidenceImageUrl: req.file ? req.file.path : null
        }, req.user);
        res.status(201).json({ success: true, data: result });
    }),

    /**
     * Admin: Danh sách giao dịch chờ duyệt (Scoping)
     */
    getPendingTransactions: asyncHandler(async (req, res) => {
        const result = await FeeService.getPendingTransactions(req.user);
        res.status(200).json({ success: true, data: result });
    }),

    approveTransaction: asyncHandler(async (req, res) => {
        const result = await FeeService.approveTransaction(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    rejectTransaction: asyncHandler(async (req, res) => {
        const { reason } = req.body;
        const result = await FeeService.rejectTransaction(req.params.id, reason, req.user);
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
