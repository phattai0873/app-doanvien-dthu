const { Activity, Attendance, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class ActivityService {
    static async getAll({ upcoming, unionBranchId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');

        const where = {
            ...buildSearchCondition(search, ['title', 'description', 'location'])
        };
        
        if (unionBranchId) {
            where[Op.or] = [
                { unionBranchId: unionBranchId },
                { unionBranchId: null }
            ];
        }

        if (upcoming === 'true') {
            where.startDate = { [Op.gte]: new Date() };
        }

        const result = await Activity.findAndCountAll({
            where,
            order: [['startDate', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const activity = await Activity.findByPk(id, {
            include: [{
                model: UnionMember,
                through: { model: Attendance, attributes: ['status', 'attendanceTime', 'remarks'] },
                attributes: ['id', 'fullName', 'memberCode']
            }]
        });
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        return activity;
    }

    static async create(data) {
        const activity = await Activity.create(data);
        
        // Thông báo về hoạt động/sinh hoạt mới
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: `Có ${activity.type.toLowerCase()} mới: ${activity.title}`,
            content: `${activity.type} sẽ diễn ra vào lúc ${new Date(activity.startDate).toLocaleString('vi-VN')} tại ${activity.location || 'địa điểm thông báo sau'}.`,
            type: activity.type === 'Sinh hoạt' ? 'Nhắc nhở' : 'Hoạt động',
            targetType: activity.unionBranchId ? 'Branch' : 'All',
            targetId: activity.unionBranchId,
            senderBranchId: activity.unionBranchId
        });

        return activity;
    }

    static async update(id, data) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        
        const oldStartTime = activity.startDate;
        const oldLocation = activity.location;

        await activity.update(data);

        // Thông báo nếu có sự thay đổi quan trọng (Thời gian/Địa điểm)
        if ((data.startDate && new Date(data.startDate).getTime() !== new Date(oldStartTime).getTime()) || (data.location && data.location !== oldLocation)) {
            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: `Thay đổi thông tin: ${activity.title}`,
                content: `Hoạt động đã có sự thay đổi về thời gian hoặc địa điểm. Vui lòng kiểm tra lại.`,
                type: 'Nhắc nhở',
                targetType: activity.unionBranchId ? 'Branch' : 'All',
                targetId: activity.unionBranchId,
                senderBranchId: activity.unionBranchId
            });
        }

        return activity;
    }

    static async delete(id) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        await activity.destroy();
        return { message: 'Đã xóa hoạt động thành công' };
    }

    static async markAttendance(activityId, memberId, status, remarks) {
        const activity = await Activity.findByPk(activityId);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        const member = await UnionMember.findByPk(memberId);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        const [attendance, created] = await Attendance.findOrCreate({
            where: { activityId, unionMemberId: memberId },
            defaults: { status, remarks, attendanceTime: new Date() }
        });
        if (!created) await attendance.update({ status, remarks, attendanceTime: new Date() });

        // Nếu điểm danh thành công (Có mặt) -> Thông báo cho đoàn viên
        if (status === 'Có mặt') {
            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: 'Điểm danh thành công',
                content: `Bạn đã được ghi nhận tham gia hoạt động: ${activity.title}`,
                type: 'Hệ thống',
                targetType: 'Individual',
                targetId: member.id,
                senderBranchId: activity.unionBranchId
            });
        }

        return attendance;
    }

    static async bulkAttendance(activityId, attendanceList) {
        const activity = await Activity.findByPk(activityId);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        return await Promise.all(
            attendanceList.map(({ memberId, status, remarks }) =>
                Attendance.findOrCreate({
                    where: { activityId, unionMemberId: memberId },
                    defaults: { status, remarks, attendanceTime: new Date() }
                }).then(([att, created]) => {
                    if (!created) att.update({ status, remarks });
                    return att;
                })
            )
        );
    }

    static async getMemberAttendance(memberId) {
        const attendances = await Attendance.findAll({
            where: { unionMemberId: memberId, status: 'Có mặt' },
            include: [{ model: Activity, attributes: ['id', 'title', 'startDate'] }]
        });
        return { attendances };
    }
}

module.exports = ActivityService;
