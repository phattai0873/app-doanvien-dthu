const asyncHandler = require('../utils/asyncHandler');
const ActivityService = require('../services/activityService');
const ErrorResponse = require('../utils/errorResponse');

const activityController = {
    getActivities: asyncHandler(async (req, res) => {
        let { upcoming, unionBranchId, unionCellId, search, page, limit, level, status } = req.query;

        // Phân quyền scoping
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember) {
            // Lấy ID chi đoàn và khoa từ hồ sơ đoàn viên gắn kèm User
            const memberUnionCellId = userUnionMember.unionCellId;
            const memberUnionBranchId = userUnionMember.unionBranchId || userUnionMember.UnionCell?.unionBranchId;
            
            if (memberUnionBranchId) unionBranchId = memberUnionBranchId;
            if (memberUnionCellId) unionCellId = memberUnionCellId;
        }

        console.log(`[Controller-getActivities] Filter -> Branch: ${unionBranchId}, Cell: ${unionCellId}, Level: ${level}`);

        const result = await ActivityService.getAll({
            upcoming, unionBranchId, unionCellId,
            search, page, limit, level, status
        });
        res.status(200).json({ success: true, ...result });
    }),

    // ... (getActivity, createActivity, updateActivity, deleteActivity remain similar)

    approveActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.approveActivity(req.params.id);
        res.status(200).json({ success: true, data: activity });
    }),

    registerParticipant: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id;
        console.log(`[Controller] User: ${req.user.id}, Member: ${memberId}`);
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const participant = await ActivityService.registerParticipant(req.params.id, memberId);
        res.status(201).json({ success: true, data: participant });
    }),

    updateParticipant: asyncHandler(async (req, res) => {
        const { memberId } = req.params;
        const participant = await ActivityService.updateParticipantStatus(req.params.id, memberId, req.body);
        res.status(200).json({ success: true, data: participant });
    }),

    getActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.getById(req.params.id);
        res.status(200).json({ success: true, data: activity });
    }),

    createActivity: asyncHandler(async (req, res) => {
        const data = req.body;

        // Tự động gán khoa nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.unionBranchId = userUnionMember.unionBranchId;
        }

        const activity = await ActivityService.create(data);
        res.status(201).json({ success: true, data: activity });
    }),

    updateActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: activity });
    }),

    deleteActivity: asyncHandler(async (req, res) => {
        const result = await ActivityService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    markAttendance: asyncHandler(async (req, res) => {
        const { memberId, status, remarks } = req.body;
        const result = await ActivityService.markAttendance(req.params.id, memberId, status, remarks);
        res.status(200).json({ success: true, data: result });
    }),

    bulkAttendance: asyncHandler(async (req, res) => {
        const { attendanceList } = req.body;
        const result = await ActivityService.bulkAttendance(req.params.id, attendanceList);
        res.status(200).json({ success: true, count: result.length, data: result });
    }),

    checkIn: asyncHandler(async (req, res) => {
        const memberId = req.user.UnionMember?.id;
        if (!memberId) throw new ErrorResponse('Bạn chưa có hồ sơ đoàn viên', 400);

        const { checkinCode } = req.body;
        const result = await ActivityService.checkIn(req.params.id, memberId, checkinCode);
        res.status(200).json({ success: true, data: result });
    }),

    getMemberAttendance: asyncHandler(async (req, res) => {
        const result = await ActivityService.getMemberAttendance(req.params.memberId);
        res.status(200).json({ success: true, data: result });
    }),

    getSummary: asyncHandler(async (req, res) => {
        const result = await ActivityService.getSummary(req.user);
        res.status(200).json(result); // Trả về object trực tiếp theo mong đợi của Mobile workService
    }),

    refreshCheckinCode: asyncHandler(async (req, res) => {
        const { checkinTTL } = req.body;
        const result = await ActivityService.refreshCheckinCode(req.params.id, checkinTTL);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = activityController;
