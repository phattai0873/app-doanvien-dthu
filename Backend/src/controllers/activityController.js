const asyncHandler = require('../utils/asyncHandler');
const ActivityService = require('../services/activityService');

const activityController = {
    getActivities: asyncHandler(async (req, res) => {
        let { upcoming, unionBranchId, search, page, limit } = req.query;
        
        // Phân quyền: Thấy hoạt động của khoa mình + hoạt động chung toàn trường
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await ActivityService.getAll({ upcoming, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getActivity: asyncHandler(async (req, res) => {
        const activity = await ActivityService.getById(req.params.id);
        res.status(200).json({ success: true, data: activity });
    }),

    createActivity: asyncHandler(async (req, res) => {
        const data = req.body;
        
        // Tự động gán khoa nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
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

    getMemberPoints: asyncHandler(async (req, res) => {
        const result = await ActivityService.getMemberPoints(req.params.memberId);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = activityController;
