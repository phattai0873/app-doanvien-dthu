const { Meeting, UnionCell, UnionMember, CellMeetingLocation, UnionBranch, Attendance } = require('../models');
const { sequelize } = require('../configs/db');
const ErrorResponse = require('../utils/errorResponse');
const { sanitizeUUID } = require('../utils/sanitize');
const crypto = require('crypto');

function generateCheckinCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

class MeetingService {
    static async getAll({ unionCellId, unionBranchId, level, status, search, page = 1, limit = 10, type, semester, academicYear } = {}) {
        const { Op } = require('sequelize');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {};
        if (level) where.level = level;
        if (status) where.status = status;
        if (type) where.type = type;
        if (semester) where.semester = semester;
        if (academicYear) where.academicYear = academicYear;
        
        const searchCondition = buildSearchCondition(search, ['title', 'content', 'academicYear']);
        
        const organizerWhere = {};
        if (unionCellId) organizerWhere.organizerCellId = unionCellId;
        if (unionBranchId) {
            organizerWhere[Op.or] = [
                { organizerBranchId: unionBranchId },
                { organizerCellId: { [Op.in]: sequelize.literal(`(SELECT id FROM union_cells WHERE "unionBranchId" = '${unionBranchId}')`) } }
            ];
        }

        const result = await Meeting.findAndCountAll({
            where: {
                [Op.and]: [
                    where,
                    searchCondition,
                    organizerWhere
                ]
            },
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'] },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'] },
                { model: CellMeetingLocation, as: 'Location', attributes: ['id', 'name', 'address'] },
                { model: UnionMember, as: 'Chairperson', attributes: ['id', 'fullName'] }
            ],
            order: [['meetingTime', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, page, l);
    }

    static async getById(id) {
        const meeting = await Meeting.findByPk(id, {
            include: [
                { model: UnionBranch, as: 'OrganizerBranch', attributes: ['id', 'name'] },
                { model: UnionCell, as: 'OrganizerCell', attributes: ['id', 'name'] },
                { model: CellMeetingLocation, as: 'Location', attributes: ['id', 'name', 'address', 'capacity'] },
                { model: UnionMember, as: 'Chairperson', attributes: ['id', 'fullName', 'avatar'] },
                { model: UnionMember, as: 'Secretary', attributes: ['id', 'fullName', 'avatar'] }
            ]
        });
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        return meeting;
    }

    static async create(data) {
        const sanitizedData = sanitizeUUID(data);
        if (!sanitizedData.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
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
        if (data.status === 'IN_PROGRESS' && !meeting.checkinCode) {
            sanitizedData.checkinCode = generateCheckinCode();
            sanitizedData.checkinCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
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

    static async refreshCheckinCode(meetingId) {
        const meeting = await Meeting.findByPk(meetingId);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        
        const newCode = generateCheckinCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        await meeting.update({ 
            checkinCode: newCode, 
            checkinCodeExpiresAt: expiresAt 
        });
        
        return { checkinCode: newCode, checkinCodeExpiresAt: expiresAt };
    }

    static async getAttendance(meetingId) {
        return await Attendance.findAll({
            where: { meetingId },
            include: [{ model: UnionMember, attributes: ['id', 'fullName', 'avatar'] }]
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
        return { message: 'Đã xóa cuộc họp thành công' };
    }
}

module.exports = MeetingService;
