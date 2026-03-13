const { UnionBranch, UnionCell, UnionMember, Activity } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionBranchService {
    static async getAll() {
        return await UnionBranch.findAll({
            include: [
                { model: UnionCell, attributes: ['id', 'name', 'code', 'memberCount'] },
                { model: UnionMember, as: 'SecretaryOfBranch', attributes: ['id', 'fullName'] }
            ],
            order: [['name', 'ASC']]
        });
    }

    static async getById(id) {
        const branch = await UnionBranch.findByPk(id, {
            include: [
                { model: UnionCell, attributes: ['id', 'name', 'code', 'memberCount'] }
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
            UnionMember.count({ where: { unionBranchId: id } }),
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
