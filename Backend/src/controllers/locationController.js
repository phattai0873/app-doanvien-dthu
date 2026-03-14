const asyncHandler = require('../utils/asyncHandler');
const { CellMeetingLocation } = require('../models');

const locationController = {
    getAll: asyncHandler(async (req, res) => {
        const locations = await CellMeetingLocation.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
        res.status(200).json({
            success: true,
            count: locations.length,
            data: locations
        });
    }),

    create: asyncHandler(async (req, res) => {
        const location = await CellMeetingLocation.create(req.body);
        res.status(201).json({
            success: true,
            data: location
        });
    })
};

module.exports = locationController;
