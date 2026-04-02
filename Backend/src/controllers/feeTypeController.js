const asyncHandler = require('../utils/asyncHandler');
const FeeTypeService = require('../services/feeTypeService');

const feeTypeController = {
    getFeeTypes: asyncHandler(async (req, res) => {
        const result = await FeeTypeService.getAll(req.query);
        res.status(200).json({ success: true, data: result });
    }),

    getFeeTypeById: asyncHandler(async (req, res) => {
        const result = await FeeTypeService.getById(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    createFeeType: asyncHandler(async (req, res) => {
        const result = await FeeTypeService.create(req.body);
        res.status(201).json({ success: true, data: result });
    }),

    updateFeeType: asyncHandler(async (req, res) => {
        const result = await FeeTypeService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: result });
    }),

    deleteFeeType: asyncHandler(async (req, res) => {
        await FeeTypeService.delete(req.params.id);
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    })
};

module.exports = feeTypeController;
