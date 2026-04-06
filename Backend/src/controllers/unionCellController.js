const asyncHandler = require('../utils/asyncHandler');
const UnionCellService = require('../services/unionCellService');

const unionCellController = {
    getCells: asyncHandler(async (req, res) => {
        const { unionBranchId, courseYear, status, search, page, limit, onlyDeleted } = req.query;
        
        const result = await UnionCellService.getAll({ 
            unionBranchId, courseYear, status, search, page, limit,
            onlyDeleted: onlyDeleted === 'true',
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    getCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.getById(req.params.id, req.user);
        res.status(200).json({ success: true, data: cell });
    }),

    getMyCell: asyncHandler(async (req, res) => {
        const cellId = req.user.unionCellId || req.user.scope?.cellId;
        const cell = await UnionCellService.getById(cellId, req.user);
        res.status(200).json({ success: true, data: cell });
    }),

    createCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.create(req.body, req.user);
        res.status(201).json({ success: true, data: cell });
    }),

    updateCell: asyncHandler(async (req, res) => {
        const cell = await UnionCellService.update(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: cell });
    }),

    deleteCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    restoreCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.restoreCell(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteCell: asyncHandler(async (req, res) => {
        const result = await UnionCellService.forceDeleteCell(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = unionCellController;
