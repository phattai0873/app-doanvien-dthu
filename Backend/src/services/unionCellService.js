const { UnionCell, UnionBranch, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class UnionCellService {
    static async getAll({ unionBranchId } = {}) {
        const where = {};
        if (unionBranchId) where.unionBranchId = unionBranchId;

        return await UnionCell.findAll({
            where,
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { model: UnionMember, as: 'SecretaryOfCell', attributes: ['id', 'fullName'] }
            ],
            order: [['name', 'ASC']]
        });
    }

    static async getById(id) {
        const cell = await UnionCell.findByPk(id, {
            include: [
                { model: UnionBranch, attributes: ['id', 'name', 'code'] },
                { model: UnionMember, attributes: ['id', 'fullName', 'memberCode'] }
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
