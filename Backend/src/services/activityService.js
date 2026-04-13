const { Activity, Attendance, UnionMember, UnionCell, UnionBranch, ActivityParticipant, User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { getScopeFilter, enforceScope, injectScope } = require('../utils/permissionHelper');
const { sanitizeUUID } = require('../utils/sanitize');
const { safeDate } = require('../utils/dateUtils');
const { Op } = require('sequelize');
const crypto = require('crypto');

function generateCheckinCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

class ActivityService {
    /**
     * Lấy danh sách hoạt động (Enterprise Scoping)
     */
    static async getAll({ upcoming, level, status, unionBranchId, unionCellId, search, page, limit, onlyDeleted, user } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {};

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        if (user && !user.isSuperAdmin) {
            const scopeFilter = getScopeFilter(user, 'activity');
            if (Object.keys(scopeFilter).length > 0) {
                where[Op.or] = [
                    scopeFilter,
                    { level: 'SCHOOL' }
                ];
            }
        }

        if (level) where.level = level;

        // Mặc định chỉ hiển thị các hoạt động đã duyệt/đang diễn ra/hoàn thành cho user thường
        if (status) {
            if (typeof status === 'string' && status.includes(',')) {
                where.status = { [Op.in]: status.split(',').map(s => s.trim().toUpperCase()) };
            } else {
                where.status = status.toUpperCase();
            }
        } else if (!user || !user.isSuperAdmin) {
            where.status = { [Op.in]: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] };
        }

        // Lọc bổ sung (Super Admin hoặc lọc thủ công trong scope)
        if (unionBranchId) where.organizedByBranchId = unionBranchId;
        if (unionCellId) where.organizedByCellId = unionCellId;

        if (upcoming === 'true') {
            where.startDate = { [Op.gte]: new Date() };
        }

        const queryOptions = {
            where,
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'], paranoid: false },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'], paranoid: false },
                { model: ActivityParticipant, attributes: ['id', 'memberId', 'registrationStatus', 'attendanceStatus'] }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['startDate', 'DESC']],
            limit: l,
            offset
        };

        if (onlyDeleted === true || onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await Activity.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, p, l);
    }

    /**
     * Lấy chi tiết hoạt động (Strict Scoping)
     */
    static async getById(id, user = null) {
        const activity = await Activity.findByPk(id, {
            paranoid: false,
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'], paranoid: false },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'], paranoid: false },
                {
                    model: ActivityParticipant,
                    include: [{
                        model: UnionMember,
                        paranoid: false,
                        attributes: ['id', 'fullName', 'memberCode', 'avatar'],
                        include: [
                            { model: User, attributes: ['phoneNumber', 'email'], paranoid: false },
                            { model: UnionCell, attributes: ['id', 'name'], paranoid: false }
                        ]
                    }]
                }
            ]
        });
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);

        // 1. Kiểm tra phạm vi truy cập (Admin context)
        if (user && activity.level !== 'SCHOOL') {
            enforceScope(user, activity);
        }

        return activity;
    }

    /**
     * Tạo hoạt động (ID Injection Protected)
     */
    static async create(data, user) {
        // 1. NGĂN CHẶN ID INJECTION: Xóa ID cũ, gán ID theo User Session
        injectScope(data, user, 'activity');

        // 2. Ép buộc 'level' phù hợp với quyền hạn quản lý
        if (user && !user.isSuperAdmin) {
            if (user.unionCellId) data.level = 'CELL';
            else if (user.unionBranchId) data.level = 'BRANCH';
        }

        if (data.startDate) data.startDate = safeDate(data.startDate, null, false);
        if (data.endDate) data.endDate = safeDate(data.endDate, null, false);

        if (!data.checkinCode) {
            data.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            data.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }

        // Tự động xác định approvalRole dựa trên level
        if (data.level === 'CELL') data.approvalRole = 'BRANCH_ADMIN';
        else if (data.level === 'BRANCH') data.approvalRole = 'SUPER_ADMIN';
        else data.status = 'APPROVED'; // School activities by super admin are auto-approved

        return await Activity.create(data);
    }

    /**
     * Cập nhật hoạt động (Safe Scope Overrides)
     */
    static async update(id, data, user) {
        const activity = await this.getById(id, user);

        // 1. Chống thay đổi đơn vị tổ chức trái phép
        injectScope(data, user, 'activity');

        if (data.startDate) data.startDate = safeDate(data.startDate, null, false);
        if (data.endDate) data.endDate = safeDate(data.endDate, null, false);

        if (data.status === 'IN_PROGRESS' && !activity.checkinCode) {
            data.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            data.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }

        await activity.update(data);
        return activity;
    }

    static async approveActivity(id, user) {
        const activity = await this.getById(id, user);
        await activity.update({ status: 'APPROVED' });

        // Notification Hook: Notify target audience
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: `Hoạt động mới: ${activity.title}`,
            content: `Thông báo hoạt động cấp ${activity.level} vừa được phê duyệt. Vui lòng xem chi tiết và đăng ký tham gia.`,
            category: 'ACTIVITY',
            targetType: activity.level === 'CELL' ? 'CELL' : (activity.level === 'BRANCH' ? 'BRANCH' : 'ALL'),
            targetId: activity.level === 'CELL' ? activity.organizedByCellId : activity.organizedByBranchId,
            entityType: 'activity',
            entityId: activity.id
        });

        return activity;
    }

    static async delete(id, user) {
        const activity = await this.getById(id, user);
        await activity.destroy();
        return { message: 'Đã chuyển hoạt động vào thùng rác' };
    }

    static async restoreActivity(id, user) {
        const activity = await this.getById(id, user); // Đã check paranoid: false
        if (!activity.deletedAt) throw new ErrorResponse('Hoạt động này chưa bị xóa', 400);

        // Kiểm tra xem đơn vị tổ chức có bị xóa không
        if (activity.level === 'CELL' && activity.organizedByCellId) {
            const cell = await UnionCell.findByPk(activity.organizedByCellId, { paranoid: false });
            if (cell && cell.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Chi đoàn tổ chức đang bị xóa.', 400);
        } else if (activity.level === 'BRANCH' && activity.organizedByBranchId) {
            const branch = await UnionBranch.findByPk(activity.organizedByBranchId, { paranoid: false });
            if (branch && branch.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Đoàn khoa tổ chức đang bị xóa.', 400);
        }

        await activity.restore();
        return activity;
    }

    static async forceDeleteActivity(id, user) {
        const activity = await this.getById(id, user);
        await activity.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn hoạt động' };
    }

    /**
     * Điểm danh (Strict check participant scope)
     */
    static async registerParticipant(activityId, memberId) {
        const member = await UnionMember.findByPk(memberId, {
            include: [{ model: UnionCell }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy thông tin đoàn viên', 404);

        const activity = await Activity.findByPk(activityId, {
            include: [{ model: ActivityParticipant, attributes: ['id', 'memberId'] }]
        });
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);

        // 1. Kiểm tra trạng thái hoạt động
        if (activity.status !== 'APPROVED' && activity.status !== 'IN_PROGRESS' && activity.status !== 'COMPLETED') {
            throw new ErrorResponse('Hoạt động này hiện không nhận đăng ký', 400);
        }

        // 2. Kiểm tra giới hạn số lượng (Slots)
        if (activity.maxParticipants && activity.ActivityParticipants && activity.ActivityParticipants.length >= activity.maxParticipants) {
            throw new ErrorResponse('Hoạt động này đã đủ số lượng người đăng ký (Hết chỗ)', 400);
        }

        // 3. Kiểm tra phân quyền đăng ký (Registration ABAC)
        const memberBranchId = member.unionBranchId || member.UnionCell?.unionBranchId;
        
        if (activity.level === 'BRANCH' || activity.level === 'CELL') {
            const orgBranchId = activity.organizedByBranchId || activity.unionBranchId;
            if (orgBranchId && memberBranchId !== orgBranchId) {
                throw new ErrorResponse(`Hoạt động này chỉ dành cho đoàn viên thuộc ${activity.level === 'BRANCH' ? 'Liên chi đoàn' : 'Khoa'} tổ chức`, 403);
            }
        }
        // Lưu ý: Hoạt động cấp SCHOOL (organizedByBranchId = null) thì ai cũng được đăng ký (trừ khi có logic khác)

        const [participant, created] = await ActivityParticipant.findOrCreate({
            where: { activityId, memberId },
            defaults: { registrationStatus: 'APPROVED' }
        });

        if (!created) throw new ErrorResponse('Đồng chí đã đăng ký hoạt động này rồi', 400);
        return participant;
    }

    static async unregisterParticipant(activityId, memberId) {
        const participant = await ActivityParticipant.findOne({ where: { activityId, memberId } });
        if (!participant) throw new ErrorResponse('Bạn chưa đăng ký hoạt động này', 404);

        if (participant.attendanceStatus === 'PRESENT') {
            throw new ErrorResponse('Không thể hủy đăng ký sau khi đã điểm danh', 400);
        }

        await participant.destroy();
        return { message: 'Đã hủy đăng ký thành công' };
    }

    static async updateParticipantStatus(activityId, memberId, { registrationStatus, attendanceStatus, scoreAwarded, remarks }, user) {
        const activity = await this.getById(activityId, user); // Check authority to manage this activity
        
        const participant = await ActivityParticipant.findOne({ where: { activityId, memberId } });
        if (!participant) throw new ErrorResponse('Dữ liệu đăng ký không tồn tại', 404);

        const oldRegStatus = participant.registrationStatus;
        await participant.update({ registrationStatus, attendanceStatus, scoreAwarded, remarks });

        if (registrationStatus === 'APPROVED' && oldRegStatus !== 'APPROVED') {
            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: 'Đăng ký đã được duyệt',
                content: `Hồ sơ đăng ký tham gia hoạt động "${activity.title}" của bạn đã được chấp nhận.`,
                category: 'SYSTEM', targetType: 'INDIVIDUAL', targetId: memberId,
                entityType: 'activity', entityId: activityId
            });
        }

        return participant;
    }

    static async markAttendance(activityId, memberId, status, remarks, user) {
        await this.getById(activityId, user); // check scope
        const participant = await ActivityParticipant.findOne({ where: { activityId, memberId } });
        if (!participant) throw new ErrorResponse('Dữ liệu đăng ký không tồn tại', 404);
        await participant.update({ attendanceStatus: status, remarks });
        return participant;
    }

    static async checkIn(activityId, memberId, checkinCode) {
        const activity = await Activity.findByPk(activityId);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        if (activity.status !== 'IN_PROGRESS') {
            throw new ErrorResponse('Hoạt động hiện không trong thời gian diễn ra', 400);
        }

        if (checkinCode && activity.checkinCode !== checkinCode) {
            throw new ErrorResponse('Mã điểm danh không chính xác', 400);
        }

        if (activity.checkinCodeExpiresAt && new Date() > new Date(activity.checkinCodeExpiresAt)) {
            throw new ErrorResponse('Mã điểm danh đã hết hạn.', 400);
        }

        const [participant, created] = await ActivityParticipant.findOrCreate({
            where: { activityId, memberId },
            defaults: { registrationStatus: 'APPROVED' }
        });

        await participant.update({ attendanceStatus: 'PRESENT' });
        return participant;
    }

    static async refreshCheckinCode(id, customTTL, user) {
        const activity = await this.getById(id, user);
        const newCode = generateCheckinCode();
        const ttl = customTTL ? parseInt(customTTL) : 15;
        const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

        await activity.update({
            checkinCode: newCode,
            checkinCodeExpiresAt: expiresAt
        });

        return { checkinCode: newCode, checkinCodeExpiresAt: expiresAt };
    }

    static async bulkAttendance(activityId, attendanceList, user) {
        await this.getById(activityId, user);
        const results = [];
        for (const item of attendanceList) {
            const participant = await ActivityParticipant.findOne({ where: { activityId, memberId: item.memberId } });
            if (participant) {
                await participant.update({ attendanceStatus: item.status, remarks: item.remarks });
                results.push(participant);
            }
        }
        return results;
    }

    static async getMemberAttendance(memberId) {
        return await ActivityParticipant.findAll({
            where: { memberId },
            include: [{ model: Activity }]
        });
    }

    static async getSummary(user) {
        const { Meeting } = require('../models');
        const nextMeeting = await Meeting.findOne({
            where: {
                status: { [Op.in]: ['SCHEDULED', 'IN_PROGRESS'] },
                meetingTime: { [Op.gte]: new Date() }
            },
            order: [['meetingTime', 'ASC']]
        });

        return {
            next_meeting: nextMeeting ? `${new Date(nextMeeting.meetingTime).toLocaleString('vi-VN')}` : 'Chưa có lịch',
            unpaid_fee: 'Đã hoàn thành'
        };
    }
}

module.exports = ActivityService;
