const { News, NewsCategory, User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const fs = require('fs');
const path = require('path');

class NewsService {
    static async getAll({ status, categoryId, level, unionBranchId, unionCellId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');

        const where = {
            ...buildSearchCondition(search, ['title', 'summary']),
            ...(status && { status }),
            ...(categoryId && { categoryId }),
            ...(level && { level })
        };

        if (unionCellId) {
            where.unionCellId = unionCellId;
        } else if (unionBranchId) {
            where[Op.and] = [
                { unionBranchId },
                { level: { [Op.ne]: 'CELL' } } // Lọc bài viết của Khoa hoặc Trường (không lấy của Lớp)
            ];
        }

        const result = await News.findAndCountAll({
            where,
            include: [
                { model: NewsCategory, attributes: ['id', 'name', 'slug'] },
                { model: User, attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const news = await News.findByPk(id, {
            include: [
                { model: NewsCategory, attributes: ['id', 'name', 'slug'] },
                { model: User, attributes: ['id', 'username'] }
            ]
        });
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        return news;
    }

    static async create(data, authorId, bannerFile) {
        // Chuyển đổi các chuỗi trống sang null cho các trường UUID để tránh lỗi Postgres
        const cleanData = { ...data };
        ['categoryId', 'unionBranchId', 'unionCellId'].forEach(field => {
            if (cleanData[field] === '') cleanData[field] = null;
        });

        const newsData = { 
            ...cleanData, 
            authorId, 
            status: cleanData.status || 'DRAFT',
            level: cleanData.level || 'SCHOOL'
        };

        if (bannerFile) {
            newsData.bannerUrl = `/uploads/news/banners/${bannerFile.filename}`;
        }

        return await News.create(newsData);
    }

    static async update(id, data, bannerFile) {
        const news = await News.findByPk(id);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);

        const updateData = { ...data };

        if (bannerFile) {
            // Xóa banner cũ nếu có
            if (news.bannerUrl) {
                const oldPath = path.join(__dirname, '../../../', news.bannerUrl); // Fix path depth
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.bannerUrl = `/uploads/news/banners/${bannerFile.filename}`;
        }

        if (data.removeBanner === 'true' || data.removeBanner === true) {
            if (news.bannerUrl) {
                const oldPath = path.join(__dirname, '../../../', news.bannerUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.bannerUrl = null;
            delete updateData.removeBanner;
        }

        await news.update(updateData);
        return news;
    }

    static async publish(id) {
        const news = await News.findByPk(id);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        await news.update({ status: 'PUBLISHED', publishedAt: new Date() });
        return news;
    }

    static async unpublish(id) {
        const news = await News.findByPk(id);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        await news.update({ status: 'DRAFT', publishedAt: null });
        return news;
    }

    static async delete(id) {
        const news = await News.findByPk(id);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);

        // Xóa file banner nếu có
        if (news.bannerUrl) {
            const bannerPath = path.join(__dirname, '../../', news.bannerUrl);
            if (fs.existsSync(bannerPath)) {
                fs.unlinkSync(bannerPath);
            }
        }

        await news.destroy();
        return { message: 'Đã xóa bài viết thành công' };
    }

    // ==================== CATEGORIES ====================

    static async getCategories({ search, isActive } = {}) {
        const where = {};
        if (search) where.name = buildSearchCondition(search, ['name']).name;
        if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

        return await NewsCategory.findAll({
            where,
            order: [['name', 'ASC']],
            attributes: ['id', 'name', 'slug', 'description', 'isActive', 'createdAt']
        });
    }

    static async getCategoryById(id) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        return category;
    }

    static async createCategory(data) {
        // Tự tạo slug nếu không truyền vào
        if (!data.slug && data.name) {
            data.slug = NewsService._generateSlug(data.name);
        }
        // Kiểm tra slug trùng
        if (data.slug) {
            const existing = await NewsCategory.findOne({ where: { slug: data.slug } });
            if (existing) {
                data.slug = `${data.slug}-${Date.now()}`;
            }
        }
        return await NewsCategory.create(data);
    }

    static async updateCategory(id, data) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);

        // Cập nhật slug nếu đổi tên và không truyền slug mới
        if (data.name && !data.slug) {
            data.slug = NewsService._generateSlug(data.name);
        }

        // Kiểm tra slug trùng (trừ chính nó)
        if (data.slug) {
            const existing = await NewsCategory.findOne({
                where: { slug: data.slug }
            });
            if (existing && existing.id !== id) {
                data.slug = `${data.slug}-${Date.now()}`;
            }
        }

        await category.update(data);
        return category;
    }

    static async deleteCategory(id) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);

        // Kiểm tra chuyên mục có bài viết không
        const newsCount = await News.count({ where: { categoryId: id } });
        if (newsCount > 0) {
            throw new ErrorResponse(
                `Không thể xóa chuyên mục vì có ${newsCount} bài viết thuộc chuyên mục này`,
                400
            );
        }

        await category.destroy();
        return { message: 'Đã xóa chuyên mục thành công' };
    }

    // ==================== HELPER ====================

    static _generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
}

module.exports = NewsService;
