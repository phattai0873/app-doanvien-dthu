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
        return await Activity.create(data);
    }

    static async update(id, data) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        await activity.update(data);
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

    static async getMemberPoints(memberId) {
        const attendances = await Attendance.findAll({
            where: { unionMemberId: memberId, status: 'Có mặt' },
            include: [{ model: Activity, attributes: ['id', 'title', 'point', 'startDate'] }]
        });
        const totalPoints = attendances.reduce((sum, att) => sum + (att.Activity?.point || 0), 0);
        return { totalPoints, attendances };
    }
}

module.exports = ActivityService;
