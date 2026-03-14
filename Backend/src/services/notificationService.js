const { Notification, NotificationReadStatus, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class NotificationService {
    static async getAll({ type, status, senderBranchId, search, page, limit, userId } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');

        const where = {
            ...buildSearchCondition(search, ['title', 'content']),
            ...(type && { type }),
            ...(status && { status }),
            ...(senderBranchId && { senderBranchId })
        };

        // Nếu là User (không phải Admin quản lý), chỉ lấy thông báo đã gửi và phù hợp đối tượng
        if (userId) {
            where.status = 'Đã gửi';
            
            // Lấy thông tin đoàn viên của user để filter target
            const member = await UnionMember.findOne({ where: { userId } });
            
            where[Op.or] = [
                { targetType: 'All' },
                ...(member ? [
                    { [Op.and]: [{ targetType: 'Branch' }, { targetId: member.unionBranchId }] },
                    { [Op.and]: [{ targetType: 'Cell' }, { targetId: member.unionCellId }] },
                    { [Op.and]: [{ targetType: 'Individual' }, { targetId: member.id }] }
                ] : [])
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
        
        // Đánh dấu isRead cho mỗi thông báo nếu có userId
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
        return await Notification.create({ ...data, status: 'Mới' });
    }

    static async update(id, data) {
        const notif = await Notification.findByPk(id);
        if (!notif) throw new ErrorResponse('Không tìm thấy thông báo', 404);
        if (notif.status === 'Đã gửi') throw new ErrorResponse('Không thể sửa thông báo đã gửi', 400);
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
        if (notif.status === 'Đã gửi') throw new ErrorResponse('Thông báo này đã được gửi', 400);
        await notif.update({ status: 'Đã gửi' });
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

    static async createSystemNotification({ title, content, type = 'Hệ thống', targetType, targetId, senderBranchId }) {
        return await Notification.create({
            title,
            content,
            type,
            targetType,
            targetId,
            senderBranchId,
            status: 'Đã gửi' // Thông báo hệ thống thì gửi luôn
        });
    }
}

module.exports = NotificationService;
