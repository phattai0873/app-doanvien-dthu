const { UnionPosition } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all positions
// @route   GET /api/positions
// @access  Private
exports.getPositions = asyncHandler(async (req, res) => {
    const positions = await UnionPosition.findAll({
        order: [['name', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: positions
    });
});
