const { UnionBranch, UnionCell, UnionMember, Activity } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionBranchService {
    static async getAll({ search, status, unionLevel, page = 1, limit = 10 } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['name', 'code', 'officeAddress']),
        };
        if (status) where.status = status;
        if (unionLevel) where.unionLevel = unionLevel;

        const result = await UnionBranch.findAndCountAll({
            where,
            include: [
                { 
                    model: UnionCell, 
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM union_members AS member
                                    WHERE
                                        member."unionCellId" = "UnionCells".id
                                )`),
                                'totalMembers'
                            ]
                        ]
                    }
                },
                { model: UnionMember, as: 'SecretaryOfBranch', attributes: ['id', 'fullName'] }
            ],
            order: [['displayOrder', 'ASC'], ['name', 'ASC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, page, l);
    }

    static async getById(id) {
        const { sequelize } = require('../configs/db');
        const branch = await UnionBranch.findByPk(id, {
            include: [
                { 
                    model: UnionCell, 
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM union_members AS member
                                    WHERE
                                        member."unionCellId" = "UnionCells".id
                                )`),
                                'totalMembers'
                            ]
                        ]
                    }
                },
                { model: UnionMember, as: 'SecretaryOfBranch', attributes: ['id', 'fullName'] }
            ]
        });
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);
        return branch;
    }

    static async create(data) {
        const existing = await UnionBranch.findOne({ where: { code: data.code } });
        if (existing) throw new ErrorResponse(`Mã liên chi đoàn "${data.code}" đã tồn tại`, 400);
        return await UnionBranch.create(data);
    }

    static async update(id, data) {
        const branch = await UnionBranch.findByPk(id);
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);
        await branch.update(data);
        return branch;
    }

    static async delete(id) {
        const branch = await UnionBranch.findByPk(id);
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);
        await branch.destroy();
        return { message: 'Đã xóa liên chi đoàn thành công' };
    }

    static async getStats(id) {
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
