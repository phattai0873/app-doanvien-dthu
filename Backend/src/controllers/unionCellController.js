const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const UnionCellService = require('../services/unionCellService');

const unionCellController = {
    getCells: asyncHandler(async (req, res) => {
        let { unionBranchId, courseYear, status, search, page, limit } = req.query;
        
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');

        // Nếu không phải Super Admin, tự động giới hạn theo đơn vị quản lý
        if (!isSuperAdmin) {
            if (req.user.unionBranchId) {
                unionBranchId = req.user.unionBranchId;
            }
        }

        const result = await UnionCellService.getAll({ 
            unionBranchId, courseYear, status, search, page, limit,
            onlyDeleted: req.query.onlyDeleted === 'true'
        });
        res.status(200).json({ success: true, ...result });
    }),

    getCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.getById(req.params.id);
        res.status(200).json({ success: true, data: cell });
    }),

    getMyCell: asyncHandler(async (req, res) => {
        const cellId = req.user.UnionMember?.unionCellId;
        if (!cellId) throw new ErrorResponse('Bạn chưa được phân vào chi đoàn nào', 404);
        const cell = await UnionCellService.getById(cellId);
        res.status(200).json({ success: true, data: cell });
    }),

    createCell: asyncHandler(async (req, res) => {
        const data = req.body;
        
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');

        if (!isSuperAdmin && req.user.unionBranchId) {
            data.unionBranchId = req.user.unionBranchId;
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
    }),

    restoreCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.restoreCell(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.forceDeleteCell(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = unionCellController;
