const asyncHandler = require('../utils/asyncHandler');
const CellMeetingService = require('../services/cellMeetingService');

const cellMeetingController = {
    getMeetings: asyncHandler(async (req, res) => {
        let { unionCellId, unionBranchId } = req.query;

        // Phân quyền: Thấy sinh hoạt của tất cả chi đoàn thuộc khoa mình
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const meetings = await CellMeetingService.getAll({ unionCellId, unionBranchId });
        res.status(200).json({ success: true, count: meetings.length, data: meetings });
    }),

    getMeeting: asyncHandler(async (req, res) => {
        const meeting = await CellMeetingService.getById(req.params.id);
        res.status(200).json({ success: true, data: meeting });
    }),

    createMeeting: asyncHandler(async (req, res) => {
        const meeting = await CellMeetingService.create(req.body);
        res.status(201).json({ success: true, data: meeting });
    }),

    updateMeeting: asyncHandler(async (req, res) => {
        const meeting = await CellMeetingService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: meeting });
    }),

    /**
     * @route PATCH /api/meetings/:id/status
     */
    updateStatus: asyncHandler(async (req, res) => {
        const meeting = await CellMeetingService.updateStatus(req.params.id, req.body.status);
        res.status(200).json({ success: true, data: meeting });
    }),

    deleteMeeting: asyncHandler(async (req, res) => {
        const result = await CellMeetingService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = cellMeetingController;
