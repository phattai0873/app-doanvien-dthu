const { UnionCell, UnionBranch, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionCellService {
    static async getAll({ unionBranchId, courseYear, status, search, page = 1, limit = 10 } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['name', 'code', 'courseYear']),
        };
        if (unionBranchId) where.unionBranchId = unionBranchId;
        if (courseYear) where.courseYear = courseYear;
        if (status) where.status = status;

        const result = await UnionCell.findAndCountAll({
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
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { 
                    model: UnionMember, 
                    as: 'SecretaryOfCell', 
                    attributes: ['id', 'fullName'],
                    include: [{ model: require('../models').User, attributes: ['id', 'avatar'] }]
                }
            ],
            order: [['name', 'ASC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, page, l);
    }

    static async getById(id) {
        const cell = await UnionCell.findByPk(id, {
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { model: UnionMember, attributes: ['id', 'fullName', 'memberCode', 'roleInUnion', 'activityStatus'] }
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
        await cell.destroy();
        return { message: 'Đã xóa chi đoàn thành công' };
    }
}

module.exports = UnionCellService;
