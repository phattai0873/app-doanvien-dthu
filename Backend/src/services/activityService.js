const { Activity, Attendance, UnionMember, UnionCell, UnionBranch, ActivityParticipant } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { sanitizeUUID } = require('../utils/sanitize');
const crypto = require('crypto');

function generateCheckinCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

class ActivityService {
    static async getAll({ upcoming, level, status, unionBranchId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');

        const where = {
            ...buildSearchCondition(search, ['title', 'description', 'location'])
        };
        
        if (level) where.level = level;
        if (status) where.status = status;
        
        if (unionBranchId) {
            where[Op.or] = [
                { unionBranchId: unionBranchId },
                { level: 'SCHOOL' }
            ];
        }

        if (upcoming === 'true') {
            where.startDate = { [Op.gte]: new Date() };
        }

        const result = await Activity.findAndCountAll({
            where,
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'] },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'] }
            ],
            order: [['startDate', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const activity = await Activity.findByPk(id, {
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'] },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'] },
                {
                    model: ActivityParticipant,
                    include: [{ model: UnionMember, attributes: ['id', 'fullName', 'memberCode', 'avatar', 'phoneNumber'], include: [{ model: UnionCell, attributes: ['id', 'name'] }] }]
                }
            ]
        });
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        return activity;
    }

    static async create(data) {
        const sanitizedData = sanitizeUUID(data);
        if (!sanitizedData.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }
        // Tự động xác định approvalRole dựa trên level
        if (sanitizedData.level === 'CELL') sanitizedData.approvalRole = 'BRANCH_ADMIN';
        else if (sanitizedData.level === 'BRANCH') sanitizedData.approvalRole = 'SUPER_ADMIN';
        else sanitizedData.status = 'APPROVED'; // School activities by super admin are auto-approved

        const activity = await Activity.create(sanitizedData);
        
        if (activity.status === 'PENDING_APPROVAL') {
            // Notify approvers (Optional but recommended)
        }

        return activity;
    }

    static async approveActivity(id) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        
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

    static async registerParticipant(activityId, memberId) {
        const activity = await Activity.findByPk(activityId);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        if (activity.status !== 'APPROVED' && activity.status !== 'IN_PROGRESS') {
            throw new ErrorResponse('Hoạt động này hiện không nhận đăng ký', 400);
        }

        const { ActivityParticipant } = require('../models');
        const [participant, created] = await ActivityParticipant.findOrCreate({
            where: { activityId, memberId },
            defaults: { registrationStatus: 'REGISTERED' }
        });

        if (!created) throw new ErrorResponse('Bạn đã đăng ký hoạt động này rồi', 400);
        return participant;
    }

    static async updateParticipantStatus(activityId, memberId, { registrationStatus, attendanceStatus, scoreAwarded, remarks }) {
        const { ActivityParticipant } = require('../models');
        const participant = await ActivityParticipant.findOne({ where: { activityId, memberId } });
        if (!participant) throw new ErrorResponse('Dữ liệu đăng ký không tồn tại', 404);

        const oldRegStatus = participant.registrationStatus;
        await participant.update({ registrationStatus, attendanceStatus, scoreAwarded, remarks });

        // Notify if approved
        if (registrationStatus === 'APPROVED' && oldRegStatus !== 'APPROVED') {
            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: 'Đăng ký đã được duyệt',
                content: `Hồ sơ đăng ký tham gia hoạt động "${activityId}" của bạn đã được chấp nhận.`,
                category: 'SYSTEM',
                targetType: 'INDIVIDUAL',
                targetId: memberId,
                entityType: 'activity',
                entityId: activityId
            });
        }

        return participant;
    }

    static async update(id, data) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        
        const sanitizedData = sanitizeUUID(data);
        if (data.status === 'IN_PROGRESS' && !activity.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }
        await activity.update(sanitizedData);
        return activity;
    }

    static async delete(id) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        await activity.destroy();
        return { message: 'Đã xóa hoạt động thành công' };
    }

    static async markAttendance(activityId, memberId, status, remarks) {
        const { ActivityParticipant } = require('../models');
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
            throw new ErrorResponse('Mã điểm danh đã hết hạn. Vui lòng liên hệ người tổ chức để làm mới mã.', 400);
        }

        const { ActivityParticipant } = require('../models');
        const [participant, created] = await ActivityParticipant.findOrCreate({
            where: { activityId, memberId },
            defaults: { registrationStatus: 'APPROVED' } // Auto approve if they are there and have the code
        });

        await participant.update({ attendanceStatus: 'PRESENT' });
        return participant;
    }

    static async refreshCheckinCode(id, customTTL) {
        const activity = await Activity.findByPk(id);
        if (!activity) throw new ErrorResponse('Không tìm thấy hoạt động', 404);
        
        const newCode = generateCheckinCode();
        const ttl = customTTL ? parseInt(customTTL) : 15;
        const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
        
        await activity.update({ 
            checkinCode: newCode, 
            checkinCodeExpiresAt: expiresAt 
        });
        
        return { checkinCode: newCode, checkinCodeExpiresAt: expiresAt };
    }

    static async bulkAttendance(activityId, attendanceList) {
        const { ActivityParticipant } = require('../models');
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
        const { ActivityParticipant, Activity } = require('../models');
        return await ActivityParticipant.findAll({
            where: { memberId },
            include: [{ model: Activity }]
        });
    }

    static async getSummary(user) {
        const { Meeting, UnionFeePayment } = require('../models');
        const { Op } = require('sequelize');
        
        // Lấy cuộc họp sắp tới
        const nextMeeting = await Meeting.findOne({
            where: {
                status: { [Op.in]: ['SCHEDULED', 'IN_PROGRESS'] },
                meetingTime: { [Op.gte]: new Date() }
            },
            order: [['meetingTime', 'ASC']]
        });

        // Tạm thời mock unpaid_fee vì logic đoàn phí phức tạp
        return {
            next_meeting: nextMeeting ? `${new Date(nextMeeting.meetingTime).toLocaleString('vi-VN')}` : 'Chưa có lịch',
            unpaid_fee: 'Đã hoàn thành' 
        };
    }
}

module.exports = ActivityService;
