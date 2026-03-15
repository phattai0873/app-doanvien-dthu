const { UnionMember, UnionCell, UnionBranch, UnionPosition, UnionMemberPosition, User, UnionMemberHistory, Role } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { Op } = require('sequelize');

class UnionMemberService {
    static async getAll({ unionCellId, unionBranchId, search, page, limit, roleInUnion, activityStatus, status, gender } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['fullName', 'memberCode', 'email', 'phoneNumber']),
        };

        if (unionCellId) where.unionCellId = unionCellId;
        if (roleInUnion) where.roleInUnion = roleInUnion;
        if (activityStatus) where.activityStatus = activityStatus;
        if (status) where.status = status;
        if (gender) where.gender = gender;

        const cellInclude = { 
            model: UnionCell, 
            attributes: ['id', 'name', 'code', 'unionBranchId'],
            include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }]
        };

        if (unionBranchId) {
            cellInclude.where = { unionBranchId };
        }

        const result = await UnionMember.findAndCountAll({
            where,
            include: [
                cellInclude,
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
                { 
                    model: UnionCell, 
                    attributes: ['id', 'name', 'code', 'unionBranchId'],
                    include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }]
                },
                { model: User, attributes: ['id', 'username', 'isActive', 'lastLogin'] },
                {
                    model: UnionPosition,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'endedDate', 'isActive'] }
                },
                { model: UnionMemberHistory, limit: 10, order: [['createdAt', 'DESC']] }
            ]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        return member;
    }

    static async create(data) {
        const existing = await UnionMember.findOne({ where: { memberCode: data.memberCode } });
        if (existing) throw new ErrorResponse(`Mã đoàn viên "${data.memberCode}" đã tồn tại`, 400);
        
        if (data.unionBranchId) delete data.unionBranchId;

        const member = await UnionMember.create(data);
        
        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'status_change',
            newValue: 'pending',
            note: 'Tạo mới hồ sơ đoàn viên'
        });

        return member;
    }

    static async update(id, data, performerId) {
        const member = await UnionMember.findByPk(id, {
            include: [{ model: UnionCell }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        
        const oldCellId = member.unionCellId;
        const oldRole = member.roleInUnion;
        const oldStatus = member.activityStatus;

        if (data.unionBranchId) delete data.unionBranchId;

        await member.update(data);

        // Track and Sync
        if (data.unionCellId && data.unionCellId !== oldCellId) {
            await UnionMemberHistory.create({
                unionMemberId: member.id,
                type: 'transfer',
                oldValue: oldCellId,
                newValue: data.unionCellId,
                note: 'Chuyển chi đoàn',
                performedBy: performerId
            });

            const NotificationService = require('./notificationService');
            await NotificationService.createSystemNotification({
                title: 'Thông báo điều chuyển đơn vị',
                content: 'Bạn đã được điều chuyển sang đơn vị sinh hoạt mới. Vui lòng kiểm tra thông tin hồ sơ.',
                category: 'SYSTEM',
                targetType: 'INDIVIDUAL',
                targetId: member.id
            });
        }

        if (data.roleInUnion && data.roleInUnion !== oldRole) {
            await UnionMemberHistory.create({
                unionMemberId: member.id,
                type: 'role_change',
                oldValue: oldRole,
                newValue: data.roleInUnion,
                performedBy: performerId
            });
            
            // Sync system roles when roleInUnion changes
            await this._syncUserSystemSpecs(member.id);
        }

        if (data.activityStatus && data.activityStatus !== oldStatus) {
            await UnionMemberHistory.create({
                unionMemberId: member.id,
                type: 'status_change',
                oldValue: oldStatus,
                newValue: data.activityStatus,
                performedBy: performerId
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
        const member = await UnionMember.findByPk(id, { include: [UnionCell] });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        
        await member.update({ status: 'approved', approvedBy: adminId });
        
        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'status_change',
            newValue: 'approved',
            note: 'Phê duyệt hồ sơ',
            performedBy: adminId
        });

        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: 'Hồ sơ đã được phê duyệt',
            content: `Chúc mừng! Hồ sơ của bạn đã được duyệt. Bạn chính thức sinh hoạt tại ${member.UnionCell?.name || 'Chi đoàn'}`,
            category: 'SYSTEM',
            targetType: 'INDIVIDUAL',
            targetId: member.id,
            entityType: 'member'
        });

        return { message: 'Đã duyệt đoàn viên thành công', data: member };
    }

    static async reject(id, adminId) {
        const member = await UnionMember.findByPk(id);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        await member.update({ status: 'rejected', approvedBy: adminId });

        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'status_change',
            newValue: 'rejected',
            note: 'Từ chối hồ sơ',
            performedBy: adminId
        });

        const NotificationService = require('./notificationService');
        await NotificationService.createSystemNotification({
            title: 'Hồ sơ bị từ chối',
            content: 'Thông tin đoàn viên của bạn bị từ chối. Vui lòng kiểm tra và cập nhật lại thông tin chính xác.',
            category: 'SYSTEM',
            targetType: 'INDIVIDUAL',
            targetId: member.id
        });

        return { message: 'Đã từ chối đoàn viên', data: member };
    }

    /**
     * Bổ nhiệm chức vụ và đồng bộ quyền hệ thống
     */
    static async assignPosition(memberId, positionId, cellId, assignedDate, performerId) {
        const member = await UnionMember.findByPk(memberId, { include: [UnionCell] });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        
        if (member.status !== 'approved') {
            throw new ErrorResponse('Chỉ có thể bổ nhiệm chức vụ cho đoàn viên đã được phê duyệt hồ sơ', 400);
        }

        const position = await UnionPosition.findByPk(positionId);
        if (!position) throw new ErrorResponse('Không tìm thấy chức vụ', 404);

        await UnionMemberPosition.update(
            { isActive: false, endedDate: new Date() },
            { where: { unionMemberId: memberId, isActive: true } }
        );

        const newPos = await UnionMemberPosition.create({
            unionMemberId: memberId,
            unionPositionId: positionId,
            unionCellId: cellId || member.unionCellId,
            assignedDate: assignedDate || new Date(),
            isActive: true
        });

        let roleInUnion = 'member';
        if (position.name.includes('Bí thư') && !position.name.includes('Phó')) {
            roleInUnion = 'secretary';
        } else if (position.name.includes('Phó Bí thư')) {
            roleInUnion = 'vice_secretary';
        } else if (position.name.includes('Ủy viên')) {
            roleInUnion = 'commissioner';
        }
        await member.update({ roleInUnion });

        // Sync Specs
        await this._syncUserSystemSpecs(member.id);

        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'role_change',
            newValue: position.name,
            note: `Bổ nhiệm chức vụ: ${position.name}`,
            performedBy: performerId
        });

        return newPos;
    }

    /**
     * Private helper to sync User Roles and Scoping based on UnionMember data
     */
    static async _syncUserSystemSpecs(memberId) {
        const member = await UnionMember.findByPk(memberId, {
            include: [
                { model: User },
                { 
                    model: UnionPosition, 
                    through: { where: { isActive: true } } 
                },
                { model: UnionCell }
            ]
        });

        if (!member || !member.User) return;

        const user = member.User;
        const activePosition = member.UnionPositions?.[0]; // Assuming one active primary position

        let systemRoleCode = 'MEMBER';
        let scopingBranchId = null;
        let scopingCellId = null;

        if (activePosition) {
            const isSecretarial = activePosition.name.includes('Bí thư');
            if (isSecretarial) {
                if (activePosition.scopeLevel === 'BRANCH') {
                    systemRoleCode = 'BRANCH_ADMIN';
                    scopingBranchId = member.UnionCell?.unionBranchId;
                } else if (activePosition.scopeLevel === 'CELL') {
                    systemRoleCode = 'CELL_ADMIN';
                    scopingCellId = member.unionCellId;
                    scopingBranchId = member.UnionCell?.unionBranchId;
                }
            }
        } else {
            // If no active position but has a roleInUnion string, we could still try to infer
            // but the Position model is the source of truth for scopeLevel.
        }

        // Apply Role
        const targetRole = await Role.findOne({ where: { code: systemRoleCode } });
        if (targetRole) {
            await user.setRoles([targetRole]);
        }
        
        // Sync scoping fields
        await user.update({
            unionBranchId: scopingBranchId,
            unionCellId: scopingCellId
        });
    }
}

module.exports = UnionMemberService;
