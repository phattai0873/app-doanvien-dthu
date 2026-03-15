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
    }),

    update: asyncHandler(async (req, res) => {
        const location = await CellMeetingLocation.findByPk(req.params.id);
        if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
        await location.update(req.body);
        res.status(200).json({ success: true, data: location });
    }),

    delete: asyncHandler(async (req, res) => {
        const location = await CellMeetingLocation.findByPk(req.params.id);
        if (!location) return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
        
        // Soft delete bằng cách set isActive = false
        await location.update({ isActive: false });
        res.status(200).json({ success: true, message: 'Đã xóa địa điểm' });
    })
};

module.exports = locationController;
