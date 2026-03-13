const { CellMeeting, UnionCell, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class CellMeetingService {
    static async getAll({ unionCellId, unionBranchId } = {}) {
        const where = {};
        if (unionCellId) where.unionCellId = unionCellId;

        return await CellMeeting.findAll({
            where,
            include: [
                { 
                    model: UnionCell, 
                    attributes: ['id', 'name', 'code'],
                    where: unionBranchId ? { unionBranchId } : undefined,
                    required: !!unionBranchId
                }
            ],
            order: [['meetingTime', 'DESC']]
        });
    }

    static async getById(id) {
        const meeting = await CellMeeting.findByPk(id, {
            include: [
                { model: UnionCell, attributes: ['id', 'name'] },
                { model: UnionMember, as: 'ChairedMeetings', attributes: ['id', 'fullName'], foreignKey: 'chairpersonId' }
            ]
        });
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        return meeting;
    }

    static async create(data) {
        return await CellMeeting.create(data);
    }

    static async update(id, data) {
        const meeting = await CellMeeting.findByPk(id);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        await meeting.update(data);
        return meeting;
    }

    static async updateStatus(id, status) {
        const meeting = await CellMeeting.findByPk(id);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        await meeting.update({ status });
        return meeting;
    }

    static async delete(id) {
        const meeting = await CellMeeting.findByPk(id);
        if (!meeting) throw new ErrorResponse('Không tìm thấy cuộc họp', 404);
        await meeting.destroy();
        return { message: 'Đã xóa cuộc họp thành công' };
    }
}

module.exports = CellMeetingService;
