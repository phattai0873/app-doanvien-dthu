const { UnionCell, UnionBranch, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getScopeFilter, enforceScope, injectScope } = require('../utils/permissionHelper');
const { Op } = require('sequelize');

class UnionCellService {
    /**
     * Lấy danh sách chi đoàn (Enterprise Scoping)
     */
    static async getAllDropdown({ unionBranchId, user } = {}) {
        const where = { status: 'active' };
        
        // Xử lý trường hợp lọc theo LCĐ (nếu có)
        if (unionBranchId && unionBranchId !== 'undefined') {
            where.unionBranchId = unionBranchId;
        }
        
        const cells = await UnionCell.findAll({
            where,
            attributes: ['id', 'name', 'code', 'unionBranchId'],
            order: [['name', 'ASC']]
        });
        return cells;
    }

    static async getAll({ unionBranchId, courseYear, status, search, page = 1, limit = 10, onlyDeleted, user } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        const scopeFilter = getScopeFilter(user, 'cell');

        const where = {
            ...scopeFilter,
            ...buildSearchCondition(search, ['name', 'code', 'courseYear']),
        };
        
        // Nếu client (Super Admin) muốn lọc theo một branchId cụ thể
        if (unionBranchId && unionBranchId !== 'undefined') {
            where.unionBranchId = unionBranchId;
        }

        if (courseYear) where.courseYear = courseYear;
        if (status) where.status = status;

        const queryOptions = {
            where,
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM union_members AS member
                            WHERE
                                member."unionCellId" = "UnionCell".id
                                AND member."deletedAt" IS NULL
                        )`),
                        'totalMembers'
                    ]
                ]
            },
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'], paranoid: false },
                { 
                    model: UnionMember, 
                    as: 'SecretaryOfCell', 
                    attributes: ['id', 'fullName'],
                    paranoid: false,
                    include: [{ model: require('../models').User, attributes: ['id', 'avatar'], paranoid: false }]
                }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['name', 'ASC']],
            limit: l,
            offset
        };

        if (onlyDeleted === true || onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await UnionCell.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, page, l);
    }

    /**
     * Lấy chi tiết chi đoàn (Strict Scoping)
     */
    static async getById(id, user) {
        const cell = await UnionCell.findByPk(id, {
            paranoid: false,
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'], paranoid: false },
                { model: UnionMember, attributes: ['id', 'fullName', 'memberCode', 'roleInUnion', 'activityStatus'], paranoid: false }
            ]
        });
        
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn', 404);
        
        // KIỂM TRA PHẠM VI TRUY CẬP: Ngăn chặn truy cập trái phép qua ID
        enforceScope(user, cell);
        
        return cell;
    }

    /**
     * Tạo chi đoàn (ID Injection Protected)
     */
    static async create(data, user) {
        // 1. NGĂN CHẶN ID INJECTION: Xóa ID cũ, gán ID theo User Session
        injectScope(data, user, 'cell');

        const existing = await UnionCell.findOne({ where: { code: data.code } });
        if (existing) throw new ErrorResponse(`Mã chi đoàn "${data.code}" đã tồn tại`, 400);
        
        return await UnionCell.create(data);
    }

    /**
     * Cập nhật chi đoàn (Safe Scope Overrides)
     */
    static async update(id, data, user) {
        // 1. Kiểm tra quyền và phạm vi hiện tại
        const cell = await this.getById(id, user); 
        
        // 2. Chống thay đổi đơn vị quản lý trái phép
        injectScope(data, user, 'cell');

        if (!user.isSuperAdmin) {
            delete data.code; 
        }

        await cell.update(data);
        return cell;
    }

    static async delete(id, user) {
        const cell = await this.getById(id, user);
        
        // Kiểm tra xem có đoàn viên nào chưa bị xóa không
        const memberCount = await UnionMember.count({ where: { unionCellId: id } });
        if (memberCount > 0) throw new ErrorResponse(`Không thể xóa Chi đoàn vì vẫn còn ${memberCount} Đoàn viên đang hoạt động.`, 400);

        await cell.destroy();
        return { message: 'Đã chuyển chi đoàn vào thùng rác' };
    }

    static async restoreCell(id, user) {
        const cell = await this.getById(id, user); // Đã lấy từ bản ghi deletedAt !== null qua getById
        if (!cell.deletedAt) throw new ErrorResponse('Chi đoàn này chưa bị xóa', 400);

        // Kiểm tra xem Đoàn khoa quản lý có bị xóa không
        if (cell.unionBranchId) {
            const branch = await UnionBranch.findByPk(cell.unionBranchId, { paranoid: false });
            if (branch && branch.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Đoàn khoa chủ quản đang bị xóa.', 400);
        }

        await cell.restore();
        return cell;
    }

    static async forceDeleteCell(id, user) {
        const cell = await this.getById(id, user);

        // Kiểm tra xem có đoàn viên nào bị xóa mềm bên trong không
        const memberCount = await UnionMember.count({ where: { unionCellId: id }, paranoid: false });
        if (memberCount > 0) throw new ErrorResponse(`Không thể xóa vĩnh viễn Chi đoàn vì vẫn còn ${memberCount} Đoàn viên liên quan trong thùng rác.`, 400);

        await cell.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn chi đoàn' };
    }
}

module.exports = UnionCellService;
