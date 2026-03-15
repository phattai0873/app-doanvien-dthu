const { Notification, NotificationReadStatus, UnionMember, Role } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { Op } = require('sequelize');

class NotificationService {
    static async getAll({ category, status, senderBranchId, search, page, limit, userId, userRole } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['title', 'content']),
            ...(category && { category }),
            ...(status && { status }),
            ...(senderBranchId && { senderBranchId })
        };

        // Nếu là User (không phải Admin quản lý Inbox), lọc theo luồng nhận
        if (userId) {
            where.status = 'SENT';
            
            // Lọc thông báo chưa hết hạn
            where[Op.or] = [
                { expiresAt: { [Op.gt]: new Date() } },
                { expiresAt: null }
            ];

            // Lấy thông tin đoàn viên của user
            const member = await UnionMember.findOne({ where: { userId } });
            
            // Logic Target: ALL, ROLE (nếu khớp role user), BRANCH (nếu khớp), CELL (nếu khớp), INDIVIDUAL (nếu khớp)
            const targetConditions = [
                { targetType: 'ALL' }
            ];

            if (userRole) {
                targetConditions.push({ [Op.and]: [{ targetType: 'ROLE' }, { targetRole: userRole }] });
            }

            if (member) {
                targetConditions.push({ [Op.and]: [{ targetType: 'BRANCH' }, { targetId: member.unionBranchId }] });
                targetConditions.push({ [Op.and]: [{ targetType: 'CELL' }, { targetId: member.unionCellId }] });
                targetConditions.push({ [Op.and]: [{ targetType: 'INDIVIDUAL' }, { targetId: member.id }] });
            }

            where[Op.and] = [
                ...(where[Op.and] || []),
                { [Op.or]: targetConditions }
            ];
        }

        const result = await Notification.findAndCountAll({
            where,
            include: userId ? [{
                model: NotificationReadStatus,
                as: 'ReadStatuses',
                where: { userId },
                required: false
            }] : [],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        const formatted = formatPaginatedResponse(result, p, l);
        
        if (userId) {
            formatted.data = formatted.data.map(n => {
                const plain = n.get({ plain: true });
                plain.isRead = n.ReadStatuses && n.ReadStatuses.length > 0;
                delete plain.ReadStatuses;
                return plain;
            });
        }

        return formatted;
    }

    static async getById(id) {
        const notif = await Notification.findByPk(id);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);
        return notif;
    }

    static async create(data) {
        return await Notification.create({ ...data, status: 'DRAFT' });
    }

    static async update(id, data) {
        const notif = await Notification.findByPk(id);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);
        if (notif.status === 'SENT') throw new ErrorResponse('Không thể sửa thông báo đã gửi', 400);
        await notif.update(data);
        return notif;
    }

    static async delete(id) {
        const notif = await Notification.findByPk(id);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);
        await notif.destroy();
        return { message: 'Đã xóa thông báo thành công' };
    }

    static async send(id) {
        const notif = await Notification.findByPk(id);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);
        if (notif.status === 'SENT') throw new ErrorResponse('Thông báo này đã được gửi', 400);
        await notif.update({ status: 'SENT' });
        return notif;
    }

    static async markAsRead(notificationId, userId) {
        const notif = await Notification.findByPk(notificationId);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);

        const [readStatus, created] = await NotificationReadStatus.findOrCreate({
            where: { notificationId, userId },
            defaults: { readAt: new Date() }
        });

        return readStatus;
    }

    static async createSystemNotification({ 
        title, content, category = 'SYSTEM', targetType, targetId, targetRole, 
        senderBranchId, entityType, entityId, expiresAt 
    }) {
        return await Notification.create({
            title,
            content,
            category,
            targetType,
            targetId,
            targetRole,
            senderBranchId,
            entityType,
            entityId,
            expiresAt,
            createdByRole: 'SYSTEM',
            status: 'SENT'
        });
    }
}

module.exports = NotificationService;
