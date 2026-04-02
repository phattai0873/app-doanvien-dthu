const { UnionBranch, UnionCell, UnionMember, Activity } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionBranchService {
    static async getAll({ search, status, unionLevel, page = 1, limit = 10, onlyDeleted } = {}) {
        const { sequelize } = require('../configs/db');
        const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
        const { offset, limit: l } = getPagination({ page, limit });

        const where = {
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

    static async getById(id) {
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
        
        // Kiểm tra xem có chi đoàn nào chưa bị xóa không
        const cellCount = await UnionCell.count({ where: { unionBranchId: id } });
        if (cellCount > 0) throw new ErrorResponse(`Không thể xóa Đoàn khoa vì vẫn còn ${cellCount} Chi đoàn đang hoạt động.`, 400);

        await branch.destroy();
        return { message: 'Đã chuyển liên chi đoàn vào thùng rác' };
    }

    static async restoreBranch(id) {
        const branch = await UnionBranch.findByPk(id, { paranoid: false });
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn trong thùng rác', 404);
        if (!branch.deletedAt) throw new ErrorResponse('Đoàn khoa này chưa bị xóa', 400);

        await branch.restore();
        return branch;
    }

    static async forceDeleteBranch(id) {
        const branch = await UnionBranch.findByPk(id, { paranoid: false });
        if (!branch) throw new ErrorResponse('Không tìm thấy liên chi đoàn', 404);

        // Kiểm tra xem có chi đoàn nào bị xóa mềm bên trong không
        const cellCount = await UnionCell.count({ where: { unionBranchId: id }, paranoid: false });
        if (cellCount > 0) throw new ErrorResponse(`Không thể xóa vĩnh viễn Đoàn khoa vì vẫn còn ${cellCount} Chi đoàn liên quan trong thùng rác.`, 400);

        await branch.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn liên chi đoàn' };
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
