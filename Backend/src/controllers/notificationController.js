const asyncHandler = require('../utils/asyncHandler');
const NotificationService = require('../services/notificationService');
const ErrorResponse = require('../utils/errorResponse');

const notificationController = {
    getNotifications: asyncHandler(async (req, res) => {
        let { category, status, senderBranchId, search, page, limit, isAdminView } = req.query;

        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;
        const userRole = roles[0]; // Giả định role chính là cái đầu tiên

        // Nếu là Admin view (quản lý thông báo đã gửi/nháp)
        if (isAdminView === 'true') {
            // Admin khoa/chi đoàn chỉ được thấy thông báo do đơn vị mình gửi
            if (!isSuperAdmin && userUnionMember?.unionBranchId) {
                senderBranchId = userUnionMember.unionBranchId;
            }
            // Trong Admin view, userId = null để filter theo admin properties (senderBranchId)
            const result = await NotificationService.getAll({ category, status, senderBranchId, search, page, limit, userId: null });
            return res.status(200).json({ success: true, ...result });
        }

        // Inbox view (Người dùng xem thông báo nhận được)
        const result = await NotificationService.getAll({ 
            category, 
            status, 
            senderBranchId, 
            search, 
            page, 
            limit, 
            userId: req.user.id,
            userRole 
        });
        res.status(200).json({ success: true, ...result });
    }),

    getNotificationById: asyncHandler(async (req, res) => {
        const notif = await NotificationService.getById(req.params.id);
        res.status(200).json({ success: true, data: notif });
    }),

    createNotification: asyncHandler(async (req, res) => {
        const data = req.body;
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        // 1. Xác định createdByRole
        if (isSuperAdmin) data.createdByRole = 'SUPER_ADMIN';
        else if (isBranchAdmin) data.createdByRole = 'BRANCH_ADMIN';
        else if (isCellAdmin) data.createdByRole = 'CELL_ADMIN';
        else data.createdByRole = 'SYSTEM'; // Default

        // 2. Kiểm tra quyền Target
        if (isSuperAdmin) {
            // Super Admin có quyền gửi mọi Target
        } else if (isBranchAdmin) {
            if (['ALL', 'ROLE'].includes(data.targetType)) {
                throw new ErrorResponse('Bí thư Liên chi đoàn không có quyền gửi toàn trường hoặc theo Role hệ thống', 403);
            }
            // Tự động gán branch của admin làm sender
            data.senderBranchId = userUnionMember?.unionBranchId;
            
            // Nếu gửi cho Branch, phải là branch của mình
            if (data.targetType === 'BRANCH') {
                data.targetId = userUnionMember?.unionBranchId;
            }
            // Gửi cho CELL hoặc Individual: Backend Service sẽ lưu đúng, Controller này check sơ bộ
        } else if (isCellAdmin) {
            if (['ALL', 'ROLE', 'BRANCH'].includes(data.targetType)) {
                throw new ErrorResponse('Bí thư Chi đoàn chỉ có quyền thông báo trong lớp', 403);
            }
            data.senderBranchId = userUnionMember?.unionBranchId;
            
            // Nếu gửi cho Cell, phải là cell của mình
            if (data.targetType === 'CELL') {
                data.targetId = userUnionMember?.unionCellId;
            }
        } else {
            throw new ErrorResponse('Bạn không có quyền tạo thông báo', 403);
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
    }),

    markAsRead: asyncHandler(async (req, res) => {
        const result = await NotificationService.markAsRead(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = notificationController;
