const asyncHandler = require('../utils/asyncHandler');
const ActivityService = require('../services/activityService');
const ErrorResponse = require('../utils/errorResponse');

const activityController = {
    getActivities: asyncHandler(async (req, res) => {
        let { upcoming, unionBranchId, unionCellId, search, page, limit, level, status, onlyDeleted } = req.query;

        const result = await ActivityService.getAll({
            upcoming, 
            unionBranchId, 
            unionCellId,
            search, 
            page, 
            limit, 
            level, 
            status,
            onlyDeleted: onlyDeleted === 'true',
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    getActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.getById(req.params.id, req.user);
        res.status(200).json({ success: true, data: activity });
    }),

    createActivity: asyncHandler(async (req, res) => {
        // Scoping và ID Injection protection được xử lý tập trung trong Service
        const activity = await ActivityService.create(req.body, req.user);
        res.status(201).json({ success: true, data: activity });
    }),

    updateActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.update(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: activity });
    }),

    deleteActivity: asyncHandler(async (req, res) => {
        const result = await ActivityService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    restoreActivity: asyncHandler(async (req, res) => {
        const result = await ActivityService.restoreActivity(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteActivity: asyncHandler(async (req, res) => {
        const result = await ActivityService.forceDeleteActivity(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    approveActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.approveActivity(req.params.id, req.user);
        res.status(200).json({ success: true, data: activity });
    }),

    registerParticipant: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id || req.user.unionMemberId;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const participant = await ActivityService.registerParticipant(req.params.id, memberId);
        res.status(201).json({ success: true, data: participant });
    }),

    unregisterParticipant: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id || req.user.unionMemberId;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const result = await ActivityService.unregisterParticipant(req.params.id, memberId);
        res.status(200).json({ success: true, ...result });
    }),

    updateParticipant: asyncHandler(async (req, res) => {
        const { memberId } = req.params;
        const participant = await ActivityService.updateParticipantStatus(req.params.id, memberId, req.body, req.user);
        res.status(200).json({ success: true, data: participant });
    }),

    markAttendance: asyncHandler(async (req, res) => {
        const { memberId, status, remarks } = req.body;
        const result = await ActivityService.markAttendance(req.params.id, memberId, status, remarks, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    bulkAttendance: asyncHandler(async (req, res) => {
        const { attendanceList } = req.body;
        const result = await ActivityService.bulkAttendance(req.params.id, attendanceList, req.user);
        res.status(200).json({ success: true, count: result.length, data: result });
    }),

    checkIn: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id || req.user.unionMemberId;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const { checkinCode } = req.body;
        const result = await ActivityService.checkIn(req.params.id, memberId, checkinCode);
        res.status(200).json({ success: true, data: result });
    }),

    getMemberAttendance: asyncHandler(async (req, res) => {
        const result = await ActivityService.getMemberAttendance(req.params.memberId);
        res.status(200).json({ success: true, data: result });
    }),

    getHistory: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id || req.user.unionMemberId;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const result = await ActivityService.getMemberAttendance(memberId);
        res.status(200).json({ success: true, data: result });
    }),

    getSummary: asyncHandler(async (req, res) => {
        const result = await ActivityService.getSummary(req.user);
        res.status(200).json(result);
    }),

    refreshCheckinCode: asyncHandler(async (req, res) => {
        const { checkinTTL } = req.body;
        const result = await ActivityService.refreshCheckinCode(req.params.id, checkinTTL, req.user);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = activityController;
