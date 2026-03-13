const asyncHandler = require('../utils/asyncHandler');
const UnionCellService = require('../services/unionCellService');

const unionCellController = {
    getCells: asyncHandler(async (req, res) => {
        let { unionBranchId } = req.query;
        
        // Nếu không phải Super Admin, chỉ cho phép quản lý chi đoàn thuộc Liên chi đoàn của mình
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const cells = await UnionCellService.getAll({ unionBranchId });
        res.status(200).json({ success: true, count: cells.length, data: cells });
    }),

    getCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.getById(req.params.id);
        res.status(200).json({ success: true, data: cell });
    }),

    createCell: asyncHandler(async (req, res) => {
        const data = req.body;
        
        // Tự động gán Liên chi đoàn nếu không phải Super Admin
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.unionBranchId = userUnionMember.unionBranchId;
        }

        const cell = await UnionCellService.create(data);
        res.status(201).json({ success: true, data: cell });
    }),

    updateCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: cell });
    }),

    deleteCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = unionCellController;
