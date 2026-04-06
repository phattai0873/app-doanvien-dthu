const { Meeting, UnionCell, UnionMember, CellMeetingLocation, UnionBranch, Attendance, User } = require('../models');
const { sequelize } = require('../configs/db');
const ErrorResponse = require('../utils/errorResponse');
const { sanitizeUUID } = require('../utils/sanitize');
const { safeDate } = require('../utils/dateUtils');

const crypto = require('crypto');

function generateCheckinCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

class MeetingService {
    static async getAll({ user, unionCellId, unionBranchId, level, status, search, page = 1, limit = 10, type, semester, academicYear, onlyDeleted } = {}) {
        const { Op } = require('sequelize');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { getScopeFilter } = require('../utils/permissionHelper');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {};
        const visibilityWhere = {};
        if (level) where.level = level;
        if (status) where.status = status;
        if (type) where.type = type;
        if (semester) where.semester = semester;
        if (academicYear) where.academicYear = academicYear;

        const searchCondition = buildSearchCondition(search, ['title', 'content', 'academicYear']);

        // --- NEW: Tự động lọc theo Scope của User ---
        const scopeFilter = getScopeFilter(user, 'organizerBranchId');
        const cellScopeFilter = getScopeFilter(user, 'organizerCellId');

        if (Object.keys(scopeFilter).length > 0) {
            // Nếu là Admin có phạm vi, chỉ thấy bài của Trường HOẶC bài trong phạm vi mình
            visibilityWhere[Op.or] = [
                { level: 'SCHOOL' },
                { 
                    [Op.and]: [
                        { level: 'BRANCH' },
                        scopeFilter 
                    ]
                },
                {
                    [Op.and]: [
                        { level: 'CELL' },
                        cellScopeFilter
                    ]
                }
            ];
        } else {
            // Nếu là Super Admin, cho phép lọc thủ công nếu có truyền ID
            if (unionBranchId) visibilityWhere.organizerBranchId = unionBranchId;
            if (unionCellId) visibilityWhere.organizerCellId = unionCellId;
        }

        const queryOptions = {
            where: {
                [Op.and]: [
                    where,
                    searchCondition,
                    visibilityWhere
                ]
            },
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'], paranoid: false },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'], paranoid: false },
                { model: CellMeetingLocation, as: 'Location', attributes: ['id', 'name', 'address'], paranoid: false },
                { model: UnionMember, as: 'Chairperson', attributes: ['id', 'fullName'], paranoid: false }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['meetingTime', 'DESC']],
            limit: l,
            offset
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            queryOptions.where[Op.and].push({ deletedAt: { [Op.ne]: null } });
        }

        const result = await Meeting.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, page, l);
    }

    static async getById(id) {
        const meeting = await Meeting.findByPk(id, {
            paranoid: false,
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'], paranoid: false },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'], paranoid: false },
                { model: CellMeetingLocation, as: 'Location', attributes: ['id', 'name', 'address', 'capacity'], paranoid: false },
                { model: UnionMember, as: 'Chairperson', attributes: ['id', 'fullName', 'avatar'], paranoid: false },
                { model: UnionMember, as: 'Secretary', attributes: ['id', 'fullName', 'avatar'], paranoid: false },
                { model: Attendance, as: 'Attendances', attributes: ['id', 'unionMemberId', 'status', 'attendanceTime'], paranoid: false }
            ]
        });
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        return meeting;
    }

    static async create(data) {
        const sanitizedData = sanitizeUUID(data);
        if (sanitizedData.meetingTime) sanitizedData.meetingTime = safeDate(sanitizedData.meetingTime);

        if (!sanitizedData.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }
        const meeting = await Meeting.create(sanitizedData);

        if (meeting.status === 'SCHEDULED') {
            await this.notifyMeetingScheduled(meeting);
        }

        return meeting;
    }

    static async update(id, data) {
        const meeting = await Meeting.findByPk(id);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);

        const oldStatus = meeting.status;
        const oldTime = meeting.meetingTime;

        const sanitizedData = sanitizeUUID(data);
        if (sanitizedData.meetingTime) sanitizedData.meetingTime = safeDate(sanitizedData.meetingTime);

        if (data.status === 'IN_PROGRESS' && !meeting.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            const ttl = data.checkinTTL ? parseInt(data.checkinTTL) : 15;
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + ttl * 60 * 1000);
        }
        await meeting.update(sanitizedData);

        // Handle status change hooks
        if (data.status && data.status !== oldStatus) {
            if (data.status === 'SCHEDULED') await this.notifyMeetingScheduled(meeting);
            if (data.status === 'IN_PROGRESS') await this.initializeAttendance(meeting);
            if (data.status === 'COMPLETED') await this.notifyMeetingCompleted(meeting);
        } else if (data.meetingTime && new Date(data.meetingTime).getTime() !== new Date(oldTime).getTime()) {
            if (meeting.status === 'SCHEDULED') await this.notifyMeetingTimeChanged(meeting);
        }

        return meeting;
    }

    static async initializeAttendance(meeting) {
        let memberIds = [];
        if (meeting.level === 'CELL' && meeting.organizerCellId) {
            const members = await UnionMember.findAll({ where: { unionCellId: meeting.organizerCellId, status: 'approved' } });
            memberIds = members.map(m => m.id);
        } else if (meeting.level === 'BRANCH' && meeting.organizerBranchId) {
            // Usually branch meetings are for key members, but if it's "all branch" members:
            const members = await UnionMember.findAll({
                include: [{ model: UnionCell, where: { unionBranchId: meeting.organizerBranchId } }],
                where: { status: 'approved' }
            });
            memberIds = members.map(m => m.id);
        }

        if (memberIds.length > 0) {
            await Promise.all(memberIds.map(mid =>
                Attendance.findOrCreate({
                    where: { meetingId: meeting.id, unionMemberId: mid },
                    defaults: { status: 'ABSENT_NO_REASON' }
                })
            ));
        }
    }

    static async checkIn(meetingId, memberId, checkinCode) {
        const meeting = await Meeting.findByPk(meetingId);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        if (meeting.status !== 'IN_PROGRESS') {
            throw new ErrorResponse('Cuộc họp chưa bắt đầu hoặc đã kết thúc', 400);
        }

        if (checkinCode && meeting.checkinCode !== checkinCode) {
            throw new ErrorResponse('Mã điểm danh không chính xác', 400);
        }

        if (meeting.checkinCodeExpiresAt && new Date() > new Date(meeting.checkinCodeExpiresAt)) {
            throw new ErrorResponse('Mã điểm danh đã hết hạn. Vui lòng liên hệ người tổ chức để làm mới mã.', 400);
        }

        const attendance = await Attendance.findOne({ where: { meetingId, unionMemberId: memberId } });
        if (!attendance) {
            // Trường hợp hy hữu: thành viên không thuộc danh sách ban đầu nhưng vẫn check-in
            return await Attendance.create({
                meetingId,
                unionMemberId: memberId,
                status: 'PRESENT',
                attendanceTime: new Date()
            });
        }

        await attendance.update({ status: 'PRESENT', attendanceTime: new Date() });
        return attendance;
    }

    static async refreshCheckinCode(meetingId, customTTL) {
        const meeting = await Meeting.findByPk(meetingId);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);

        const newCode = generateCheckinCode();
        const ttl = customTTL ? parseInt(customTTL) : 15;
        const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

        await meeting.update({
            checkinCode: newCode,
            checkinCodeExpiresAt: expiresAt
        });

        return { checkinCode: newCode, checkinCodeExpiresAt: expiresAt };
    }

    static async getAttendance(meetingId) {
        return await Attendance.findAll({
            where: { meetingId },
            include: [{
                model: UnionMember,
                attributes: ['id', 'fullName', 'avatar', 'memberCode'],
                include: [
                    { model: User, attributes: ['phoneNumber', 'email'] },
                    { model: UnionCell, attributes: ['id', 'name'] }
                ]
            }]
        });
    }

    static async notifyMeetingScheduled(meeting) {
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: `Lịch họp mới: ${meeting.title}`,
            content: `Cuộc họp sẽ diễn ra vào lúc ${new Date(meeting.meetingTime).toLocaleString('vi-VN')}.`,
            category: 'MEETING',
            targetType: meeting.level === 'CELL' ? 'CELL' : (meeting.level === 'BRANCH' ? 'BRANCH' : 'ALL'),
            targetId: meeting.level === 'CELL' ? meeting.organizerCellId : meeting.organizerBranchId,
            entityType: 'meeting',
            entityId: meeting.id
        });
    }

    static async notifyMeetingCompleted(meeting) {
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: `Hoàn thành cuộc họp: ${meeting.title}`,
            content: `Biên bản cuộc họp đã được cập nhật. Vui lòng xem lại nếu vắng mặt.`,
            category: 'MEETING',
            targetType: meeting.level === 'CELL' ? 'CELL' : (meeting.level === 'BRANCH' ? 'BRANCH' : 'ALL'),
            targetId: meeting.level === 'CELL' ? meeting.organizerCellId : meeting.organizerBranchId,
            entityType: 'meeting',
            entityId: meeting.id
        });
    }

    static async notifyMeetingTimeChanged(meeting) {
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: `Thay đổi giờ họp: ${meeting.title}`,
            content: `Giờ họp đã được thay đổi sang ${new Date(meeting.meetingTime).toLocaleString('vi-VN')}.`,
            category: 'MEETING',
            targetType: meeting.level === 'CELL' ? 'CELL' : (meeting.level === 'BRANCH' ? 'BRANCH' : 'ALL'),
            targetId: meeting.level === 'CELL' ? meeting.organizerCellId : meeting.organizerBranchId,
            entityType: 'meeting',
            entityId: meeting.id
        });
    }

    static async delete(id) {
        const meeting = await Meeting.findByPk(id);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        await meeting.destroy();
        return { message: 'Đã chuyển cuộc họp vào thùng rác' };
    }

    static async restoreMeeting(id) {
        const meeting = await Meeting.findByPk(id, { paranoid: false });
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp trong thùng rác', 404);
        if (!meeting.deletedAt) throw new ErrorResponse('Cuộc họp này chưa bị xóa', 400);

        // Kiểm tra xem đơn vị tổ chức có bị xóa không
        if (meeting.level === 'CELL' && meeting.organizerCellId) {
            const cell = await UnionCell.findByPk(meeting.organizerCellId, { paranoid: false });
            if (cell && cell.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Chi đoàn tổ chức đang bị xóa.', 400);
        } else if (meeting.level === 'BRANCH' && meeting.organizerBranchId) {
            const branch = await UnionBranch.findByPk(meeting.organizerBranchId, { paranoid: false });
            if (branch && branch.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Đoàn khoa tổ chức đang bị xóa.', 400);
        }

        await meeting.restore();
        return meeting;
    }

    static async forceDeleteMeeting(id) {
        const meeting = await Meeting.findByPk(id, { paranoid: false });
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);

        // Xóa các dữ liệu liên quan nếu cần
        
        await meeting.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn cuộc họp' };
    }
}

module.exports = MeetingService;
