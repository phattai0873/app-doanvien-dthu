const { UnionMember, UnionCell, UnionBranch, UnionPosition, UnionMemberPosition, User, UnionMemberHistory, Role } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { safeDate } = require('../utils/dateUtils');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { Op } = require('sequelize');
const { getScopeFilter, enforceNestedScope, hasPermission, injectScope } = require('../utils/permissionHelper');

class UnionMemberService {
    /**
     * Lấy danh sách đoàn viên (Enterprise Scoping)
     */
    static async getAll({ unionCellId, unionBranchId, search, page, limit, roleInUnion, activityStatus, status, gender, onlyDeleted, user } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động theo Entity Type
        const scopeFilter = getScopeFilter(user, 'member');

        const where = {
            ...scopeFilter,
            ...buildSearchCondition(search, ['fullName', 'memberCode']),
        };

        // Lọc bổ sung từ Client (vẫn nằm trong scope nếu có)
        if (unionCellId) where.unionCellId = unionCellId;
        if (roleInUnion) where.roleInUnion = roleInUnion;
        if (activityStatus) where.activityStatus = activityStatus;
        if (status) where.status = status;
        if (gender) where.gender = gender;

        const cellInclude = { 
            model: UnionCell, 
            attributes: ['id', 'name', 'code', 'unionBranchId', 'secretaryId', 'deputySecretaryId'],
            include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }],
            // Đảm bảo include cell để getScopeFilter('member') hoạt động nếu dùng $nested$
        };

        // Nếu client (Super Admin) muốn lọc theo một branchId cụ thể
        if (unionBranchId && unionBranchId !== 'undefined') {
            where['$UnionCell.unionBranchId$'] = unionBranchId;
        }

        const queryOptions = {
            where: {
                ...where,
                ...(search && {
                    [Op.or]: [
                        ...(where[Op.or] || []),
                        { '$User.email$': { [Op.iLike]: `%${search}%` } },
                        { '$User.phoneNumber$': { [Op.iLike]: `%${search}%` } }
                    ]
                })
            },
            subQuery: false,
            include: [
                cellInclude,
                { model: User, attributes: ['id', 'username', 'email', 'phoneNumber'], paranoid: false },
                { model: User, as: 'Approver', attributes: ['id', 'username'], paranoid: false },
                {
                    model: UnionPosition,
                    through: {
                        model: UnionMemberPosition,
                        where: { isActive: true },
                        attributes: ['unionBranchId', 'unionCellId']
                    },
                    required: false
                }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['fullName', 'ASC']],
            limit: l,
            offset
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            queryOptions.where.deletedAt = { [Op.ne]: null };
        }

        const result = await UnionMember.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, p, l);
    }

    /**
     * Lấy chi tiết đoàn viên (Strict Scoping)
     */
    static async getById(id, user) {
        const member = await UnionMember.findByPk(id, {
            paranoid: false,
            include: [
                { 
                    model: UnionCell, 
                    paranoid: false,
                    attributes: ['id', 'name', 'code', 'unionBranchId'],
                    include: [{ model: UnionBranch, paranoid: false, attributes: ['id', 'name', 'code'] }]
                },
                { model: User, paranoid: false, attributes: ['id', 'username', 'email', 'phoneNumber', 'isActive', 'lastLogin'] },
                {
                    model: UnionPosition,
                    paranoid: false,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'endedDate', 'isActive'] }
                },
                { model: UnionMemberHistory, limit: 10, order: [['createdAt', 'DESC']] }
            ]
        });
        
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        // KIỂM TRA PHẠM VI NGHIÊM NGẶT: Nếu thiếu UnionCell sẽ ném lỗi ngay
        enforceNestedScope(user, member, ['UnionCell', 'unionBranchId']);

        return member;
    }

    /**
     * Lấy hồ sơ đoàn viên theo UserId (Dùng cho My Profile)
     */
    static async getByUserId(userId) {
        const member = await UnionMember.findOne({
            where: { userId },
            include: [
                { 
                    model: UnionCell, 
                    attributes: ['id', 'name', 'code', 'unionBranchId'],
                    include: [{ model: UnionBranch, attributes: ['id', 'name', 'code'] }]
                },
                { model: User, attributes: ['id', 'username', 'email', 'phoneNumber'] },
                {
                    model: UnionPosition,
                    through: { model: UnionMemberPosition, attributes: ['assignedDate', 'isActive'] }
                }
            ]
        });
        
        return member; // Trả về null nếu chưa có hồ sơ, Controller sẽ xử lý
    }

    /**
     * Tạo hồ sơ đoàn viên (ID Injection Protected)
     */
    static async create(data, user) {
        const canCreateOthers = hasPermission(user, 'member:create');
        if (!canCreateOthers && data.userId !== user?.id) {
            throw new ErrorResponse('Bạn không có quyền tạo hồ sơ cho người khác', 403);
        }

        // 1. NGĂN CHẶN ID INJECTION: Xóa ID cũ, gán ID theo User Session
        injectScope(data, user, 'member');

        ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
            if (data[field]) data[field] = safeDate(data[field]);
        });
        
        if (!data.memberCode) data.memberCode = `DV-${Date.now()}`;

        const existing = await UnionMember.findOne({ where: { memberCode: data.memberCode } });
        if (existing) throw new ErrorResponse(`Mã đoàn viên "${data.memberCode}" đã tồn tại`, 400);

        const member = await UnionMember.create({ ...data, status: 'pending' });

        if (member.userId && (data.email || data.phoneNumber)) {
            await User.update(
                { email: data.email, phoneNumber: data.phoneNumber },
                { where: { id: member.userId } }
            );
        }
        
        await UnionMemberHistory.create({
            unionMemberId: member.id,
            type: 'status_change',
            newValue: 'pending',
            note: 'Tạo mới hồ sơ đoàn viên'
        });

        return member;
    }

    /**
     * Cập nhật hồ sơ (Safe ID Overrides)
     */
    static async update(id, data, performerId, user) {
        // 1. Kiểm tra quyền và phạm vi trước
        const member = await this.getById(id, user); 
        
        // 2. Chống ID Injection
        injectScope(data, user, 'member');

        ['dateOfBirth', 'joinedDate', 'officialDate'].forEach(field => {
            if (data[field]) data[field] = safeDate(data[field]);
        });

        const oldCellId = member.unionCellId;
        const oldRole = member.roleInUnion;
        const oldStatus = member.activityStatus;

        // Xóa các field nhạy cảm không được phép sửa tự do
        if (!user.isSuperAdmin) {
            delete data.memberCode;
        }
        
        await member.update(data);

        // Đồng bộ email/phone sang User model
        if (member.userId && (data.email || data.phoneNumber)) {
            const userUpdate = {};
            if (data.email) userUpdate.email = data.email;
            if (data.phoneNumber) userUpdate.phoneNumber = data.phoneNumber;
            await User.update(userUpdate, { where: { id: member.userId } });
        }

        // Ghi lại lịch sử nếu có biến đổi quan trọng
        if (data.unionCellId && data.unionCellId !== oldCellId) {
            await UnionMemberHistory.create({
                unionMemberId: member.id, type: 'transfer', oldValue: oldCellId,
                newValue: data.unionCellId, note: 'Chuyển chi đoàn', performedBy: performerId
            });
        }

        if (data.roleInUnion && data.roleInUnion !== oldRole) {
            await UnionMemberHistory.create({
                unionMemberId: member.id, type: 'role_change', oldValue: oldRole,
                newValue: data.roleInUnion, performedBy: performerId
            });
            await this._syncUserSystemSpecs(member.id);
        }

        return member;
    }

    static async delete(id, user) {
        const member = await this.getById(id, user);
        await member.destroy();
        return { message: 'Đã chuyển hồ sơ đoàn viên vào thùng rác' };
    }

    static async restore(id, user) {
        const member = await this.getById(id, user); // Đã bao gồm paranoid check qua getById? 
        // Đợi đã, getById đang dùng findByPk(id, { paranoid: false }) nên lấy được cả bản ghi đã xóa
        
        if (member.userId) {
            const userLinked = await User.findByPk(member.userId, { paranoid: false });
            if (userLinked && userLinked.deletedAt) {
                throw new ErrorResponse('Hãy khôi phục tài khoản liên kết trước.', 400);
            }
        }

        await member.restore();
        return member;
    }

    static async forceDelete(id, user) {
        const member = await this.getById(id, user);
        await member.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn hồ sơ đoàn viên' };
    }

    static async approve(id, user) {
        const member = await this.getById(id, user);
        if (member.status !== 'pending' && member.status !== 'rejected') {
            throw new ErrorResponse('Hồ sơ không ở trạng thái chờ duyệt', 400);
        }

        await member.update({ status: 'approved', approvedBy: user.id });
        
        await UnionMemberHistory.create({
            unionMemberId: member.id, type: 'status_change', newValue: 'approved',
            note: 'Phê duyệt hồ sơ', performedBy: user.id
        });

        return { message: 'Đã duyệt đoàn viên thành công', data: member };
    }

    static async reject(id, user) {
        const member = await this.getById(id, user);
        await member.update({ status: 'rejected', approvedBy: user.id });

        await UnionMemberHistory.create({
            unionMemberId: member.id, type: 'status_change', newValue: 'rejected',
            note: 'Từ chối hồ sơ', performedBy: user.id
        });

        return { message: 'Đã từ chối đoàn viên', data: member };
    }

    static async assignPosition(memberId, positionId, { branchId, cellId, assignedDate, moveMember = false } = {}, user) {
        const member = await this.getById(memberId, user);
        if (member.status !== 'approved') throw new ErrorResponse('Chỉ có thể bổ nhiệm cho đoàn viên đã duyệt', 400);

        const position = await UnionPosition.findByPk(positionId);
        if (!position) throw new ErrorResponse('Không tìm thấy chức vụ', 404);

        // 1. Kiểm tra quyền bổ nhiệm theo cấp bậc
        if (!user.isSuperAdmin && position.scopeLevel === 'SCHOOL') {
            throw new ErrorResponse('Bạn không có quyền bổ nhiệm chức vụ cấp Trường', 403);
        }

        // 2. Thu hồi (deactivate) toàn bộ chức vụ hiện tại (One-Active-Position Rule)
        await UnionMemberPosition.update(
            { isActive: false, endedDate: new Date() },
            { where: { unionMemberId: memberId, isActive: true } }
        );

        // 3. Tạo bản ghi bổ nhiệm mới với ID phạm vi rõ ràng
        const newPos = await UnionMemberPosition.create({
            unionMemberId: memberId,
            unionPositionId: positionId,
            unionBranchId: branchId || (position.scopeLevel === 'BRANCH' ? member.UnionCell?.unionBranchId : null),
            unionCellId: cellId || (position.scopeLevel === 'CELL' ? member.unionCellId : null),
            assignedDate: assignedDate || new Date(),
            isActive: true
        });

        // 4. Member Transfer: Nếu moveMember = true, cập nhật đơn vị sinh hoạt chính của đoàn viên
        if (moveMember) {
            const updateData = {};
            if (cellId) updateData.unionCellId = cellId;
            else if (branchId) {
                // Nếu chỉ gán LCĐ, tìm một chi đoàn "văn phòng" hoặc null?
                // Ở đây ta ưu tiên cellId nếu có, nếu không thì giữ nguyên hoặc set null
            }
            if (Object.keys(updateData).length > 0) {
                await member.update(updateData);
            }
        }

        // 5. Đồng bộ chức vụ nòng cốt (trên model UnionMember)
        let roleInUnion = 'member';
        if (position.name.includes('Bí thư') && !position.name.includes('Phó')) roleInUnion = 'secretary';
        else if (position.name.includes('Phó Bí thư')) roleInUnion = 'vice_secretary';
        else if (position.name.includes('Ủy viên')) roleInUnion = 'commissioner';
        
        await member.update({ roleInUnion });

        // 6. Đồng bộ Hệ thống (Role/Scope trên User model)
        await this._syncUserSystemSpecs(member.id);

        return newPos;
    }

    /**
     * Đồng bộ Role và Scope Quản trị từ Chức vụ sang Tài khoản
     */
    static async _syncUserSystemSpecs(memberId) {
        // Lấy member kèm tài khoản và chức vụ đang hoạt động (bao gồm cả unit gán trực tiếp)
        const member = await UnionMember.findByPk(memberId, {
            include: [
                { model: User },
                { 
                    model: UnionPosition, 
                    through: { 
                        model: UnionMemberPosition,
                        where: { isActive: true } 
                    } 
                },
                { model: UnionCell }
            ]
        });

        if (!member || !member.User) return;
        
        const user = member.User;
        const activePosition = member.UnionPositions?.[0]; // One-active rule

        let targetRoleCode = 'MEMBER';
        let scopingBranchId = null;
        let scopingCellId = null;

        if (activePosition) {
            const isLeader = activePosition.name.includes('Bí thư'); // Bao gồm cả Bí thư và Phó Bí thư
            const isSecretary = isLeader && !activePosition.name.includes('Phó');

            // 1. Phân vai trò hệ thống
            if (isLeader) {
                if (activePosition.scopeLevel === 'BRANCH') targetRoleCode = 'BRANCH_ADMIN';
                else if (activePosition.scopeLevel === 'CELL') targetRoleCode = 'CELL_ADMIN';
            }

            // 2. Lấy Phạm vi Quản trị (Scope) từ bản ghi Position (tránh đoán mò)
            const posPivot = activePosition.UnionMemberPosition;
            if (posPivot) {
                scopingBranchId = posPivot.unionBranchId;
                scopingCellId = posPivot.unionCellId;
            }

            // 3. Cập nhật SecretaryId cho Đơn vị (nếu là Bí thư)
            if (isSecretary) {
                if (activePosition.scopeLevel === 'BRANCH' && scopingBranchId) {
                    await UnionBranch.update({ secretaryId: member.id }, { where: { id: scopingBranchId } });
                } else if (activePosition.scopeLevel === 'CELL' && scopingCellId) {
                    await UnionCell.update({ secretaryId: member.id }, { where: { id: scopingCellId } });
                }
            }
        }

        // 3. Thực thi Đồng bộ vào User model
        const targetRole = await Role.findOne({ where: { code: targetRoleCode } });
        if (targetRole) {
            await user.setRoles([targetRole]);
        } else {
            await user.setRoles([]); // Fallback to no role (MEMBER is usually implied by empty)
        }

        await user.update({
            unionBranchId: scopingBranchId,
            unionCellId: scopingCellId,
            // role field dự phòng trên User nếu có (tùy schema cũ)
            role: targetRoleCode 
        });

        console.log(`[Sync-Spec] Member ${member.fullName}: Role ${targetRoleCode}, Scope B:${scopingBranchId}, C:${scopingCellId}`);
    }
}

module.exports = UnionMemberService;
