const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const MeetingService = require('../services/meetingService');

const meetingController = {
    getMeetings: asyncHandler(async (req, res) => {
        let { unionCellId, unionBranchId, level, status, search, page, limit, type, semester, academicYear } = req.query;

        // Phân quyền scoping
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const meetings = await MeetingService.getAll({ 
            unionCellId, unionBranchId, level, status, 
            search, page, limit, type, semester, academicYear 
        });
        res.status(200).json({ success: true, ...meetings });
    }),

    getMeeting: asyncHandler(async (req, res) => {
        const meeting = await MeetingService.getById(req.params.id);
        res.status(200).json({ success: true, data: meeting });
    }),

    createMeeting: asyncHandler(async (req, res) => {
        const meeting = await MeetingService.create(req.body);
        res.status(201).json({ success: true, data: meeting });
    }),

    updateMeeting: asyncHandler(async (req, res) => {
        const meeting = await MeetingService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: meeting });
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const { status } = req.body;
        const meeting = await MeetingService.update(req.params.id, { status });
        res.status(200).json({ success: true, data: meeting });
    }),

    deleteMeeting: asyncHandler(async (req, res) => {
        const result = await MeetingService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    checkIn: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);
        
        const { checkinCode } = req.body;
        const attendance = await MeetingService.checkIn(req.params.id, memberId, checkinCode);
        res.status(200).json({ success: true, data: attendance });
    }),

    getAttendance: asyncHandler(async (req, res) => {
        const attendance = await MeetingService.getAttendance(req.params.id);
        res.status(200).json({ success: true, data: attendance });
    }),

    refreshCheckinCode: asyncHandler(async (req, res) => {
        const result = await MeetingService.refreshCheckinCode(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = meetingController;
