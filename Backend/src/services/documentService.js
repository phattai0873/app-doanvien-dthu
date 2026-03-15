const { Document, DocumentCategory } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class DocumentService {
    static async getAll({ search, categoryId, level, unionBranchId, unionCellId, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');
        
        const where = {
            ...buildSearchCondition(search, ['title', 'issuingAuthority']),
            ...(categoryId && { categoryId }),
            ...(level && { level })
        };

        if (unionCellId) {
            where.unionCellId = unionCellId;
        } else if (unionBranchId) {
            where[Op.and] = [
                { unionBranchId },
                { level: { [Op.ne]: 'CELL' } }
            ];
        }

        const result = await Document.findAndCountAll({
            where,
            include: [
                { model: DocumentCategory, attributes: ['id', 'name'], required: false }
            ],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const doc = await Document.findByPk(id, {
            include: [{ model: DocumentCategory, attributes: ['id', 'name'], required: false }]
        });
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        return doc;
    }

    static async create(data, file) {
        if (file) {
            data.filePath = `/uploads/documents/${file.filename}`;
            data.fileType = file.mimetype;
        } else if (!data.filePath) {
            throw new ErrorResponse('Vui lòng tải lên tập tin văn bản', 400);
        }
        return await Document.create(data);
    }

    static async update(id, data, file) {
        const doc = await Document.findByPk(id);
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        
        if (file) {
            data.filePath = `/uploads/documents/${file.filename}`;
            data.fileType = file.mimetype;
        }
        
        await doc.update(data);
        return doc;
    }

    static async delete(id) {
        const doc = await Document.findByPk(id);
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        await doc.destroy();
        return { message: 'Đã xóa văn bản thành công' };
    }

    static async getCategories() {
        return await DocumentCategory.findAll({ order: [['name', 'ASC']] });
    }
}

module.exports = DocumentService;
