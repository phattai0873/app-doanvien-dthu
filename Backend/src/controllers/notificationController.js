const asyncHandler = require('../utils/asyncHandler');
const NotificationService = require('../services/notificationService');

const notificationController = {
    getNotifications: asyncHandler(async (req, res) => {
        let { type, status, senderBranchId, search, page, limit } = req.query;
        
        // Phân quyền: Admin khoa chỉ thấy thông báo của khoa mình gửi
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            senderBranchId = userUnionMember.unionBranchId;
        }

        const result = await NotificationService.getAll({ type, status, senderBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getNotificationById: asyncHandler(async (req, res) => {
        const notif = await NotificationService.getById(req.params.id);
        res.status(200).json({ success: true, data: notif });
    }),

    createNotification: asyncHandler(async (req, res) => {
        const data = req.body;
        
        // Tự động gán người gửi nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.senderBranchId = userUnionMember.unionBranchId;
        }

        const notif = await NotificationService.create(data);
        res.status(201).json({ success: true, data: notif });
    }),

    updateNotification: asyncHandler(async (req, res) => {
        const notif = await NotificationService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: notif });
    }),

    deleteNotification: asyncHandler(async (req, res) => {
        const result = await NotificationService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    sendNotification: asyncHandler(async (req, res) => {
        const notif = await NotificationService.send(req.params.id);
        res.status(200).json({ success: true, data: notif });
    })
};

module.exports = notificationController;
