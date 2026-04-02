const { UnionCell, UnionBranch, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionCellService {
    static async getAll({ unionBranchId, courseYear, status, search, page = 1, limit = 10, onlyDeleted } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['name', 'code', 'courseYear']),
        };
        if (unionBranchId) where.unionBranchId = unionBranchId;
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

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await UnionCell.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, page, l);
    }

    static async getById(id) {
        const cell = await UnionCell.findByPk(id, {
            paranoid: false,
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'], paranoid: false },
                { model: UnionMember, attributes: ['id', 'fullName', 'memberCode', 'roleInUnion', 'activityStatus'], paranoid: false }
            ]
        });
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn', 404);
        return cell;
    }

    static async create(data) {
        const existing = await UnionCell.findOne({ where: { code: data.code } });
        if (existing) throw new ErrorResponse(`Mã chi đoàn "${data.code}" đã tồn tại`, 400);
        return await UnionCell.create(data);
    }

    static async update(id, data) {
        const cell = await UnionCell.findByPk(id);
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn', 404);
        await cell.update(data);
        return cell;
    }

    static async delete(id) {
        const cell = await UnionCell.findByPk(id);
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn', 404);
        
        // Kiểm tra xem có đoàn viên nào chưa bị xóa không
        const memberCount = await UnionMember.count({ where: { unionCellId: id } });
        if (memberCount > 0) throw new ErrorResponse(`Không thể xóa Chi đoàn vì vẫn còn ${memberCount} Đoàn viên đang hoạt động.`, 400);

        await cell.destroy();
        return { message: 'Đã chuyển chi đoàn vào thùng rác' };
    }

    static async restoreCell(id) {
        const cell = await UnionCell.findByPk(id, { paranoid: false });
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn trong thùng rác', 404);
        if (!cell.deletedAt) throw new ErrorResponse('Chi đoàn này chưa bị xóa', 400);

        // Kiểm tra xem Đoàn khoa quản lý có bị xóa không
        if (cell.unionBranchId) {
            const branch = await UnionBranch.findByPk(cell.unionBranchId, { paranoid: false });
            if (branch && branch.deletedAt) throw new ErrorResponse('Không thể khôi phục vì Đoàn khoa chủ quản đang bị xóa.', 400);
        }

        await cell.restore();
        return cell;
    }

    static async forceDeleteCell(id) {
        const cell = await UnionCell.findByPk(id, { paranoid: false });
        if (!cell) throw new ErrorResponse('Không tìm thấy chi đoàn', 404);

        // Kiểm tra xem có đoàn viên nào bị xóa mềm bên trong không
        const memberCount = await UnionMember.count({ where: { unionCellId: id }, paranoid: false });
        if (memberCount > 0) throw new ErrorResponse(`Không thể xóa vĩnh viễn Chi đoàn vì vẫn còn ${memberCount} Đoàn viên liên quan trong thùng rác.`, 400);

        await cell.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn chi đoàn' };
    }
}

module.exports = UnionCellService;
