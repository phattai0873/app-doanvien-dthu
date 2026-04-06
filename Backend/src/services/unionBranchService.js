const { UnionBranch, UnionCell, UnionMember, Activity } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getScopeFilter, enforceScope, injectScope } = require('../utils/permissionHelper');
const { Op } = require('sequelize');

class UnionBranchService {
    /**
     * Lấy danh sách liên chi đoàn (Enterprise Scoping)
     */
    static async getAll({ search, status, unionLevel, page = 1, limit = 10, onlyDeleted, user } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        // Lưu ý: Admin khoa chỉ thấy chính khoa của mình
        const scopeFilter = getScopeFilter(user, 'branch');

        const where = {
            ...scopeFilter,
            ...buildSearchCondition(search, ['name', 'code', 'officeAddress']),
        };
        
        if (status) where.status = status;
        if (unionLevel) where.unionLevel = unionLevel;

        const queryOptions = {
            where,
            include: [
                { 
                    model: UnionCell, 
                    paranoid: false,
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM union_members AS member
                                    WHERE
                                        member."unionCellId" = "UnionCells".id
                                        AND member."deletedAt" IS NULL
                                )`),
                                'totalMembers'
                            ]
                        ]
                    }
                },
                { model: UnionMember, as: 'SecretaryOfBranch', attributes: ['id', 'fullName'], paranoid: false }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['displayOrder', 'ASC'], ['name', 'ASC']],
            limit: l,
            offset
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await UnionBranch.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, page, l);
    }

    /**
     * Lấy chi tiết liên chi đoàn (Strict Scoping)
     */
    static async getById(id, user) {
        const { sequelize } = require('../configs/db');
        const branch = await UnionBranch.findByPk(id, {
            paranoid: false,
            include: [
                { 
                    model: UnionCell, 
                    paranoid: false,
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM union_members AS member
                                    WHERE
                                        member."unionCellId" = "UnionCells".id
                                        AND member."deletedAt" IS NULL
                                )`),
                                'totalMembers'
                            ]
                        ]
                    }
                },
                { model: UnionMember, as: 'SecretaryOfBranch', attributes: ['id', 'fullName'], paranoid: false }
            ]
        });
        
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);
        
        // KIỂM TRA PHẠM VI TRUY CẬP: Ngăn chặn hack ID để xem khoa khác
        enforceScope(user, branch);
        
        return branch;
    }

    /**
     * Tạo liên chi đoàn (Chỉ Super Admin)
     */
    static async create(data, user) {
        if (!user.isSuperAdmin) {
            throw new ErrorResponse('Chỉ Quản trị viên cấp cao mới có quyền tạo mới Liên chi đoàn', 403);
        }

        const existing = await UnionBranch.findOne({ where: { code: data.code } });
        if (existing) throw new ErrorResponse(`Mã liên chi đoàn "${data.code}" đã tồn tại`, 400);
        return await UnionBranch.create(data);
    }

    /**
     * Cập nhật liên chi đoàn (ID Injection Protected)
     */
    static async update(id, data, user) {
        // 1. Kiểm tra phạm vi truy cập
        const branch = await this.getById(id, user);
        
        // 2. Chống thay đổi những thông tin nhạy cảm
        injectScope(data, user, 'branch');
        
        if (!user.isSuperAdmin) {
            delete data.code; 
        }

        await branch.update(data);
        return branch;
    }

    /**
     * Xóa mềm (Chỉ Super Admin)
     */
    static async delete(id, user) {
        const branch = await this.getById(id, user);
        
        if (!user.isSuperAdmin) {
            throw new ErrorResponse('Chỉ Quản trị viên cấp cao mới có quyền xóa Liên chi đoàn', 403);
        }

        const cellCount = await UnionCell.count({ where: { unionBranchId: id } });
        if (cellCount > 0) throw new ErrorResponse(`Không thể xóa Đoàn khoa khi vẫn còn ${cellCount} Chi đoàn đang hoạt động.`, 400);

        await branch.destroy();
        return { message: 'Đã chuyển liên chi đoàn vào thùng rác' };
    }

    static async restoreBranch(id, user) {
        if (!user.isSuperAdmin) {
            throw new ErrorResponse('Chỉ Quản trị viên cấp cao mới có quyền khôi phục Liên chi đoàn', 403);
        }

        const branch = await this.getById(id, user);
        if (!branch.deletedAt) throw new ErrorResponse('Đoàn khoa này chưa bị xóa', 400);

        await branch.restore();
        return branch;
    }

    static async forceDeleteBranch(id, user) {
        if (!user.isSuperAdmin) {
            throw new ErrorResponse('Chỉ Quản trị viên cấp cao mới có quyền xóa vĩnh viễn Liên chi đoàn', 403);
        }

        const branch = await this.getById(id, user);

        const cellCount = await UnionCell.count({ where: { unionBranchId: id }, paranoid: false });
        if (cellCount > 0) throw new ErrorResponse(`Không thể xóa vĩnh viễn Đoàn khoa vì vẫn còn ${cellCount} Chi đoàn liên quan trong thùng rác.`, 400);

        await branch.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn liên chi đoàn' };
    }

    /**
     * Thống kê (Scope-Aware)
     */
    static async getStats(id, user) {
        // Áp dụng scope filter cho thống kê
        const scopeFilter = getScopeFilter(user, 'branch');
        if (scopeFilter.id && scopeFilter.id !== id) {
            id = scopeFilter.id;
        }

        const branch = await UnionBranch.findByPk(id);
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);

        const [cellCount, memberCount, activityCount] = await Promise.all([
            UnionCell.count({ where: { unionBranchId: id } }),
            UnionMember.count({ 
                include: [{
                    model: UnionCell,
                    where: { unionBranchId: id },
                    required: true
                }]
            }),
            Activity.count({ where: { unionBranchId: id } })
        ]);

        return {
            branchName: branch.name,
            counts: {
                cells: cellCount,
                members: memberCount,
                activities: activityCount
            }
        };
    }
}

module.exports = UnionBranchService;
