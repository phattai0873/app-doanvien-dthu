const { Document, DocumentCategory } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { safeDate } = require('../utils/dateUtils');


class DocumentService {
    static async getAll({ search, categoryId, status, page, limit, unionBranchId, onlyDeleted } = {}) {
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

        const queryOptions = {
            where,
            include: [
                { model: DocumentCategory, attributes: ['id', 'name'], required: false, paranoid: false }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['createdAt', 'DESC']],
            limit: l,
            offset
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await Document.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const doc = await Document.findByPk(id, {
            paranoid: false,
            include: [{ model: DocumentCategory, attributes: ['id', 'name'], required: false, paranoid: false }]
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
        return { message: 'Đã chuyển văn bản vào thùng rác' };
    }

    static async restoreDocument(id) {
        const doc = await Document.findByPk(id, { paranoid: false });
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản trong thùng rác', 404);
        if (!doc.deletedAt) throw new ErrorResponse('Văn bản này chưa bị xóa', 400);

        // Kiểm tra xem chuyên mục của văn bản có bị xóa không
        if (doc.categoryId) {
            const category = await DocumentCategory.findByPk(doc.categoryId, { paranoid: false });
            if (category && category.deletedAt) throw new ErrorResponse('Không thể khôi phục vì chuyên mục đang bị xóa.', 400);
        }

        await doc.restore();
        return doc;
    }

    static async forceDeleteDocument(id) {
        const doc = await Document.findByPk(id, { paranoid: false });
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);

        // Xóa file vật lý
        if (doc.filePath) {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(__dirname, '../../../', doc.filePath); // Fix path depth
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        await doc.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn văn bản và tập tin đính kèm' };
    }

    static async toggleStatus(id) {
        const doc = await Document.findByPk(id);
        if (!doc) throw new ErrorResponse('Không tìm thấy văn bản', 404);
        doc.status = doc.status === 'PUBLISH' ? 'PRIVATE' : 'PUBLISH';
        await doc.save();
        return doc;
    }

    static async getCategories({ onlyDeleted = false } = {}) {
        const queryOptions = {
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['name', 'ASC']]
        };
        if (onlyDeleted) {
            queryOptions.paranoid = false;
            queryOptions.where = { deletedAt: { [Op.ne]: null } };
        }
        return await DocumentCategory.findAll(queryOptions);
    }

    static async restoreCategory(id) {
        const cat = await DocumentCategory.findByPk(id, { paranoid: false });
        if (!cat) throw new ErrorResponse('Không tìm thấy chuyên mục trong thùng rác', 404);
        await cat.restore();
        return cat;
    }

    static async forceDeleteCategory(id) {
        const cat = await DocumentCategory.findByPk(id, { paranoid: false });
        if (!cat) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        
        // Kiểm tra xem có văn bản nào liên quan không
        const docCount = await Document.count({ where: { categoryId: id }, paranoid: false });
        if (docCount > 0) throw new ErrorResponse(`Không thể xóa vĩnh viễn chuyên mục vì vẫn còn ${docCount} văn bản liên quan.`, 400);

        await cat.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn chuyên mục' };
    }

    static async deleteCategory(id) {
        const cat = await DocumentCategory.findByPk(id);
        if (!cat) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        
        // Check if there are active documents in this category
        const docCount = await Document.count({ where: { categoryId: id } });
        if (docCount > 0) throw new ErrorResponse('Không thể xóa chuyên mục đang có văn bản hoạt động', 400);

        await cat.destroy();
        return { message: 'Đã chuyển chuyên mục vào thùng rác' };
    }
}

module.exports = DocumentService;
