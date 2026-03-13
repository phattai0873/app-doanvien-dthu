const asyncHandler = require('../utils/asyncHandler');
const UnionBranchService = require('../services/unionBranchService');

const unionBranchController = {
    getBranches: asyncHandler(async (req, res) => {
        const branches = await UnionBranchService.getAll();
        res.status(200).json({ success: true, count: branches.length, data: branches });
    }),

    getBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.getById(req.params.id);
        res.status(200).json({ success: true, data: branch });
    }),

    createBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.create(req.body);
        res.status(201).json({ success: true, data: branch });
    }),

    updateBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: branch });
    }),

    deleteBranch: asyncHandler(async (req, res) => {
        const result = await UnionBranchService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    getBranchStats: asyncHandler(async (req, res) => {
        let id = req.params.id;
        
        // Nếu là Admin khoa, chỉ cho phép xem thống kê của khoa mình
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            id = userUnionMember.unionBranchId;
        }

        const stats = await UnionBranchService.getStats(id);
        res.status(200).json({ success: true, data: stats });
    })
};

module.exports = unionBranchController;
