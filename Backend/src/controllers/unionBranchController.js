const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const UnionBranchService = require('../services/unionBranchService');

const unionBranchController = {
    getBranches: asyncHandler(async (req, res) => {
        const { search, status, unionLevel, page, limit } = req.query;
        const result = await UnionBranchService.getAll({ search, status, unionLevel, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getBranch: asyncHandler(async (req, res) => {
        const branch = await UnionBranchService.getById(req.params.id);
        res.status(200).json({ success: true, data: branch });
    }),

    getMyBranch: asyncHandler(async (req, res) => {
        const cellId = req.user.UnionMember?.unionCellId;
        if (!cellId) throw new ErrorResponse('Bạn chưa có thông tin tổ chức', 404);
        
        const { UnionCell } = require('../models');
        const cell = await UnionCell.findByPk(cellId);
        if (!cell || !cell.unionBranchId) throw new ErrorResponse('Không tìm thấy liên chi đoàn quản lý', 404);
        
        const branch = await UnionBranchService.getById(cell.unionBranchId);
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
        
        // Nếu không phải Super Admin, chỉ cho phép xem thống kê của khoa mình
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');

        if (!isSuperAdmin && req.user.unionBranchId) {
            id = req.user.unionBranchId;
        }

        const stats = await UnionBranchService.getStats(id);
        res.status(200).json({ success: true, data: stats });
    })
};

module.exports = unionBranchController;
