const asyncHandler = require('../utils/asyncHandler');
const UnionBranchService = require('../services/unionBranchService');

const unionBranchController = {
    getBranches: asyncHandler(async (req, res) => {
        const { search, status, unionLevel, page, limit, onlyDeleted } = req.query;
        const result = await UnionBranchService.getAll({ 
            search, status, unionLevel, page, limit,
            onlyDeleted: onlyDeleted === 'true',
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    getBranchesAll: asyncHandler(async (req, res) => {
        const branches = await UnionBranchService.getAllDropdown({ user: req.user });
        res.status(200).json({ success: true, data: branches });
    }),

    getBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.getById(req.params.id, req.user);
        res.status(200).json({ success: true, data: branch });
    }),

    getMyBranch: asyncHandler(async (req, res) => {
        const branchId = req.user.unionBranchId || req.user.scope?.branchId;
        const branch = await UnionBranchService.getById(branchId, req.user);
        res.status(200).json({ success: true, data: branch });
    }),

    createBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.create(req.body, req.user);
        res.status(201).json({ success: true, data: branch });
    }),

    updateBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.update(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: branch });
    }),

    deleteBranch: asyncHandler(async (req, res) => {
        const result = await UnionBranchService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    restoreBranch: asyncHandler(async (req, res) => {
        const result = await UnionBranchService.restoreBranch(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteBranch: asyncHandler(async (req, res) => {
        const result = await UnionBranchService.forceDeleteBranch(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    getBranchStats: asyncHandler(async (req, res) => {
        const stats = await UnionBranchService.getStats(req.params.id, req.user);
        res.status(200).json({ success: true, data: stats });
    })
};

module.exports = unionBranchController;
