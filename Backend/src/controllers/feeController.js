const asyncHandler = require('../utils/asyncHandler');
const FeeService = require('../services/feeService');

const feeController = {
    getFees: asyncHandler(async (req, res) => {
        let { period, memberId, unionCellId, unionBranchId, search, page, limit } = req.query;
        
        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await FeeService.getAll({ period, memberId, unionCellId, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    createFee: asyncHandler(async (req, res) => {
        const fee = await FeeService.create(req.body);
        res.status(201).json({ success: true, data: fee });
    }),

    getUnpaidMembers: asyncHandler(async (req, res) => {
        let { period, unionCellId, unionBranchId, search, page, limit } = req.query;

        // Phân quyền theo Liên chi đoàn
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
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
    })
};

module.exports = feeController;
