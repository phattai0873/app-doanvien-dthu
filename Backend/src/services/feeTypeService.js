const { UnionFeeType } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

class FeeTypeService {
    static async getAll(query = {}) {
        const { isActive } = query;
        const where = {};
        if (isActive !== undefined) where.isActive = isActive === 'true';

        return await UnionFeeType.findAll({ where, order: [['createdAt', 'DESC']] });
    }

    static async getById(id) {
        const type = await UnionFeeType.findByPk(id);
        if (!type) throw new ErrorResponse('Không tìm thấy loại phí', 404);
        return type;
    }

    static async create(data) {
        return await UnionFeeType.create(data);
    }

    static async update(id, data) {
        const type = await UnionFeeType.findByPk(id);
        if (!type) throw new ErrorResponse('Không tìm thấy loại phí', 404);
        return await type.update(data);
    }

    static async delete(id) {
        const type = await UnionFeeType.findByPk(id);
        if (!type) throw new ErrorResponse('Không tìm thấy loại phí', 404);
        return await type.destroy();
    }
}

module.exports = FeeTypeService;
