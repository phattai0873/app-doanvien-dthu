const asyncHandler = require('../utils/asyncHandler');
const FeeService = require('../services/feeService');

const feeController = {
    getFees: asyncHandler(async (req, res) => {
        let { period, memberId, unionCellId, unionBranchId, search, page, limit } = req.query;
        
        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getAll({ period, memberId, unionCellId, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    createFee: asyncHandler(async (req, res) => {
        const data = { ...req.body };
        
        // Tự động gán unionMemberId từ user token nếu thiếu hoặc không hợp lệ (dành cho mobile)
        if ((!data.unionMemberId || data.unionMemberId === 'undefined' || data.unionMemberId === 'null') && req.user?.UnionMember?.id) {
            data.unionMemberId = req.user.UnionMember.id;
        }

        if (req.file) {
            data.evidenceImage = `/uploads/fees/${req.file.filename}`;
        }
        const fee = await FeeService.create(data);
        res.status(201).json({ success: true, data: fee });
    }),

    getUnpaidMembers: asyncHandler(async (req, res) => {
        let { period, unionCellId, unionBranchId, search, page, limit } = req.query;

        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getUnpaidMembers(period, { unionCellId, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    deleteFee: asyncHandler(async (req, res) => {
        const result = await FeeService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const { status, note } = req.body;
        const result = await FeeService.updateStatus(req.params.id, { status, note });
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = feeController;
