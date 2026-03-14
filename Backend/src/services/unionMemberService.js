const { UnionMember, UnionCell, UnionBranch, UnionPosition, UnionMemberPosition, User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class UnionMemberService {
    /**
     * Lấy danh sách đoàn viên (có phân trang, lọc, tìm kiếm)
     */
    static async getAll({ unionCellId, unionBranchId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['fullName', 'memberCode', 'email', 'phoneNumber']),
            ...(unionCellId && { unionCellId }),
            ...(unionBranchId && { unionBranchId })
        };

        const result = await UnionMember.findAndCountAll({
            where,
            include: [
                { model: UnionCell, attributes: ['id', 'name', 'code'] },
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { model: User, as: 'Approver', attributes: ['id', 'username'] }
            ],
            order: [['fullName', 'ASC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const member = await UnionMember.findByPk(id, {
            include: [
                { model: UnionCell, attributes: ['id', 'name', 'code'] },
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { model: User, attributes: ['id', 'username', 'isActive', 'lastLogin'] },
                {
                    model: UnionPosition,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'endedDate', 'isActive'] }
                }
            ]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        return member;
    }

    static async create(data) {
        const existing = await UnionMember.findOne({ where: { memberCode: data.memberCode } });
        if (existing) throw new ErrorResponse(`Mã đoàn viên "${data.memberCode}" đã tồn tại`, 400);
        return await UnionMember.create(data);
    }

    static async update(id, data) {
        const member = await UnionMember.findByPk(id, { include: [UnionCell] });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        
        const oldCellId = member.unionCellId;
        const oldBranchId = member.unionBranchId;

        await member.update(data);

        // Kiểm tra nếu có sự thay đổi đơn vị (Điều chuyển)
        if ((data.unionCellId && data.unionCellId !== oldCellId) || (data.unionBranchId && data.unionBranchId !== oldBranchId)) {
            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: 'Thông báo điều chuyển đơn vị',
                content: 'Bạn đã được điều chuyển sang đơn vị sinh hoạt mới. Vui lòng kiểm tra thông tin hồ sơ.',
                type: 'Hệ thống',
                targetType: 'Individual',
                targetId: member.id,
                senderBranchId: data.unionBranchId || member.unionBranchId
            });
        }

        return member;
    }

    static async delete(id) {
        const member = await UnionMember.findByPk(id);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        await member.destroy();
        return { message: 'Đã xóa đoàn viên thành công' };
    }

    static async approve(id, adminId) {
        const member = await UnionMember.findByPk(id);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        await member.update({ status: 'approved', approvedBy: adminId });
        
        // Thông báo cho đoàn viên
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: 'Hồ sơ đã được phê duyệt',
            content: `Chúc mừng! Hồ sơ của bạn đã được duyệt. Bạn chính thức sinh hoạt tại ${member.UnionCell?.name || 'Chi đoàn'}`,
            type: 'Hệ thống',
            targetType: 'Individual',
            targetId: member.id,
            senderBranchId: member.unionBranchId
        });

        return { message: 'Đã duyệt đoàn viên thành công', data: member };
    }

    static async reject(id, adminId) {
        const member = await UnionMember.findByPk(id);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        await member.update({ status: 'rejected', approvedBy: adminId });

        // Thông báo cho đoàn viên
        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: 'Hồ sơ bị từ chối',
            content: 'Thông tin đoàn viên của bạn bị từ chối. Vui lòng kiểm tra và cập nhật lại thông tin chính xác.',
            type: 'Hệ thống',
            targetType: 'Individual',
            targetId: member.id,
            senderBranchId: member.unionBranchId
        });

        return { message: 'Đã từ chối đoàn viên', data: member };
    }

    static async assignPosition(memberId, positionId, cellId, assignedDate) {
        const member = await UnionMember.findByPk(memberId);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        const position = await UnionPosition.findByPk(positionId);
        if (!position) throw new ErrorResponse('Không tìm thấy chức vụ', 404);

        await UnionMemberPosition.update(
            { isActive: false, endedDate: new Date() },
            { where: { unionMemberId: memberId, isActive: true } }
        );

        return await UnionMemberPosition.create({
            unionMemberId: memberId,
            unionPositionId: positionId,
            unionCellId: cellId,
            assignedDate: assignedDate || new Date(),
            isActive: true
        });
    }
}

module.exports = UnionMemberService;
