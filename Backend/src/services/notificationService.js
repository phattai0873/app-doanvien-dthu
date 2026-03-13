const { Notification } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class NotificationService {
    static async getAll({ type, status, senderBranchId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const where = {
            ...buildSearchCondition(search, ['title', 'content']),
            ...(type && { type }),
            ...(status && { status }),
            ...(senderBranchId && { senderBranchId })
        };

        const result = await Notification.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
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
}

module.exports = NotificationService;
