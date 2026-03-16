const { Document, DocumentCategory } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { safeDate } = require('../utils/dateUtils');


class DocumentService {
    static async getAll({ search, categoryId, status, page, limit, unionBranchId } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');
        
        const where = {
            ...buildSearchCondition(search, ['title', 'issuingAuthority']),
            ...(categoryId && { categoryId })
        };
        
        // Default visibility: only PUBLISH for public
        if (status) {
            where.status = status;
        } else {
            where.status = 'PUBLISH';
        }

        const scopingConditions = [];

        // Public documents (no specific branch or cell)
        scopingConditions.push({ [Op.and]: [{ unionBranchId: null }, { unionCellId: null }] });

        if (unionBranchId) {
            scopingConditions.push({ unionBranchId: unionBranchId });
            scopingConditions.push({ level: 'SCHOOL' });
        }

        where[Op.or] = scopingConditions;

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
        if (data.issuedDate) data.issuedDate = safeDate(data.issuedDate);

        if (file) {
            data.filePath = `/uploads/documents/${file.filename}`;
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
        }
        
        if (data.issuedDate) data.issuedDate = safeDate(data.issuedDate);
        await doc.update(data);

        return doc;
    }

    static async delete(id) {
        const doc = await Document.findByPk(id);
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        await doc.destroy();
        return { message: 'Đã xóa văn bản thành công' };
    }

    static async toggleStatus(id) {
        const doc = await Document.findByPk(id);
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        doc.status = doc.status === 'PUBLISH' ? 'PRIVATE' : 'PUBLISH';
        await doc.save();
        return doc;
    }

    static async getCategories() {
        return await DocumentCategory.findAll({ order: [['name', 'ASC']] });
    }

    static async createCategory(data) {
        return await DocumentCategory.create(data);
    }

    static async updateCategory(id, data) {
        const cat = await DocumentCategory.findByPk(id);
        if (!cat) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        await cat.update(data);
        return cat;
    }

    static async deleteCategory(id) {
        const cat = await DocumentCategory.findByPk(id);
        if (!cat) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        
        // Check if there are documents in this category
        const docCount = await Document.count({ where: { categoryId: id } });
        if (docCount > 0) throw new ErrorResponse('Không thể xóa chuyên mục đang có văn bản', 400);

        await cat.destroy();
        return { message: 'Đã xóa chuyên mục thành công' };
    }
}

module.exports = DocumentService;
