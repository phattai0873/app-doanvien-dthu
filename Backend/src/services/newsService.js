const { News, NewsCategory, User, NewsLike, NewsComment, NewsCommentLike, NewsCommentReport } = require('../models');
const { Op, literal } = require('sequelize');
const { getScopeFilter, enforceScope, injectScope } = require('../utils/permissionHelper');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const fs = require('fs');
const path = require('path');

class NewsService {
    /**
     * Lấy danh sách tin tức (Enterprise Scoping)
     */
    static async getAll({ status, categoryId, level, scope, unionBranchId, unionCellId, search, page, limit, userId, onlyDeleted, user } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        const scopeFilter = getScopeFilter(user, 'news');

        const where = {
            ...scopeFilter,
            ...buildSearchCondition(search, ['title', 'summary']),
            ...(status && { status }),
            ...(categoryId && { categoryId }),
            ...(level && { level }),
            ...(scope && { scope })
        };

        // Lọc bài đã đến giờ đăng nếu là bài PUBLISHED
        if (status === 'PUBLISHED') {
            where.publishedAt = { [Op.lte]: new Date() };
        }

        const queryOptions = {
            where,
            include: [
                { model: NewsCategory, attributes: ['id', 'name', 'slug'], paranoid: false },
                { model: User, attributes: ['id', 'username'], paranoid: false }
            ],
            attributes: {
                include: [
                    [
                        literal(`EXISTS(SELECT 1 FROM news_likes WHERE "newsId" = "News"."id" AND "userId" = '${userId || '00000000-0000-0000-0000-000000000000'}')`),
                        'isLiked'
                    ]
                ]
            },
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
            limit: l,
            offset
        };

        if (onlyDeleted === true || onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await News.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, p, l);
    }

    /**
     * Lấy chi tiết tin tức (Strict Scoping)
     */
    static async getById(id, userId = null, user = null) {
        const news = await News.findByPk(id, {
            paranoid: false,
            include: [
                { model: NewsCategory, attributes: ['id', 'name', 'slug'], paranoid: false },
                { model: User, attributes: ['id', 'username'], paranoid: false }
            ],
            attributes: {
                include: [
                    [
                        literal(`EXISTS(SELECT 1 FROM news_likes WHERE "newsId" = "News"."id" AND "userId" = '${userId || '00000000-0000-0000-0000-000000000000'}')`),
                        'isLiked'
                    ]
                ]
            }
        });
        
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        
        // 1. Kiểm tra phạm vi truy cập nếu là Admin
        if (user) {
            enforceScope(user, news);
        }
        
        // Tăng lượt xem (chỉ cho bài đã đăng)
        if (news.status === 'PUBLISHED') {
            await news.increment('viewsCount');
        }
        
        return news;
    }

    /**
     * Tạo bài viết (Enterprise Scoping)
     */
    static async create(data, authorId, bannerFile, user) {
        // 1. NGĂN CHẶN ID INJECTION: Xóa ID cũ, gán ID theo User Session
        injectScope(data, user, 'news');

        // 2. Ép buộc 'level' phù hợp với quyền hạn
        if (user && !user.isSuperAdmin) {
            if (user.unionCellId) data.level = 'CELL';
            else if (user.unionBranchId) data.level = 'BRANCH';
        }

        const newsData = {
            ...data,
            authorId,
            status: data.status || 'DRAFT'
        };

        if (bannerFile) {
            newsData.bannerUrl = `/uploads/news/banners/${bannerFile.filename}`;
        }

        return await News.create(newsData);
    }

    /**
     * Cập nhật bài viết (Enterprise Scoping)
     */
    static async update(id, data, bannerFile, user) {
        // 1. Kiểm tra quyền và phạm vi hiện tại
        const news = await this.getById(id, null, user);

        // 2. Chống thay đổi đơn vị quản lý bài viết
        injectScope(data, user, 'news');

        const updateData = { ...data };
        
        if (bannerFile) {
            // Xóa banner cũ nếu có
            if (news.bannerUrl) {
                const oldPath = path.join(__dirname, '../../../', news.bannerUrl);
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

    static async publish(id, publishedAt = null, user) {
        const news = await this.getById(id, null, user);
        await news.update({
            status: 'PUBLISHED',
            publishedAt: publishedAt || news.publishedAt || new Date()
        });
        return news;
    }

    static async unpublish(id, user) {
        const news = await this.getById(id, null, user);
        await news.update({ status: 'DRAFT', publishedAt: null });
        return news;
    }

    static async delete(id, user) {
        const news = await this.getById(id, null, user);
        await news.destroy();
        return { message: 'Đã chuyển bài viết vào thùng rác' };
    }

    static async restore(id, user) {
        const news = await this.getById(id, null, user); // Đã bao gồm paranoid check qua getById
        if (!news.deletedAt) throw new ErrorResponse('Bài viết này chưa bị xóa', 400);

        // Kiểm tra xem chuyên mục có bị xóa không
        if (news.categoryId) {
            const category = await NewsCategory.findByPk(news.categoryId, { paranoid: false });
            if (category && category.deletedAt) {
                throw new ErrorResponse('Không thể khôi phục vì chuyên mục đang bị xóa.', 400);
            }
        }

        await news.restore();
        return news;
    }

    static async forceDelete(id, user) {
        const news = await this.getById(id, null, user);

        // Xóa file banner vật lý
        if (news.bannerUrl) {
            const bannerPath = path.join(__dirname, '../../../', news.bannerUrl);
            if (fs.existsSync(bannerPath)) {
                fs.unlinkSync(bannerPath);
            }
        }

        await news.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn bài viết' };
    }

    // ==================== LIKE & SHARE ====================

    static async likeNews(newsId, userId) {
        const { sequelize } = require('../configs/db');
        const t = await sequelize.transaction();
        try {
            const news = await News.findByPk(newsId, { transaction: t });
            if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
            const [like, created] = await NewsLike.findOrCreate({
                where: { newsId, userId },
                transaction: t
            });
            if (created) {
                await news.increment('likesCount', { by: 1, transaction: t });
            }
            await t.commit();
            return { isLiked: true, likesCount: news.likesCount + (created ? 1 : 0) };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async unlikeNews(newsId, userId) {
        const { sequelize } = require('../configs/db');
        const t = await sequelize.transaction();
        try {
            const news = await News.findByPk(newsId, { transaction: t });
            if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
            const deleted = await NewsLike.destroy({
                where: { newsId, userId },
                transaction: t
            });
            if (deleted) {
                await news.decrement('likesCount', { by: 1, transaction: t });
            }
            await t.commit();
            return { isLiked: false, likesCount: Math.max(0, news.likesCount - (deleted ? 1 : 0)) };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async shareNews(newsId) {
        const news = await News.findByPk(newsId);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        await news.increment('sharesCount', { by: 1 });
        return { sharesCount: news.sharesCount + 1 };
    }

    // ==================== COMMENTS ====================

    static async getComments(newsId, { page, limit, userId } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const result = await NewsComment.findAndCountAll({
            where: { newsId, parentId: null, status: 'VISIBLE' },
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
            attributes: {
                include: [
                    [
                        literal(`EXISTS(SELECT 1 FROM news_comment_likes WHERE "commentId" = "NewsComment"."id" AND "userId" = '${userId || '00000000-0000-0000-0000-000000000000'}')`),
                        'isLiked'
                    ],
                    [
                        literal(`(SELECT COUNT(*) FROM news_comments WHERE "parentId" = "NewsComment"."id" AND "status" = 'VISIBLE')`),
                        'repliesCount'
                    ]
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });
        return formatPaginatedResponse(result, p, l);
    }

    static async getReplies(commentId, { userId } = {}) {
        return await NewsComment.findAll({
            where: { parentId: commentId, status: 'VISIBLE' },
            include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
            attributes: {
                include: [
                    [
                        literal(`EXISTS(SELECT 1 FROM news_comment_likes WHERE "commentId" = "NewsComment"."id" AND "userId" = '${userId || '00000000-0000-0000-0000-000000000000'}')`),
                        'isLiked'
                    ]
                ]
            },
            order: [['createdAt', 'ASC']]
        });
    }

    static async createComment(newsId, userId, { content, parentId } = {}) {
        if (!content || content.trim() === '') throw new ErrorResponse('Nội dung bình luận không được để trống', 400);
        const news = await News.findByPk(newsId);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        if (parentId) {
            const parent = await NewsComment.findByPk(parentId);
            if (!parent) throw new ErrorResponse('Không tìm thấy bình luận gốc', 404);
            if (parent.parentId !== null) throw new ErrorResponse('Hệ thống chỉ hỗ trợ trả lời bình luận cấp 1', 400);
        }
        return await NewsComment.create({ newsId, userId, content: content.trim(), parentId: parentId || null });
    }

    static async likeComment(commentId, userId) {
        const { sequelize } = require('../configs/db');
        const t = await sequelize.transaction();
        try {
            const comment = await NewsComment.findByPk(commentId, { transaction: t });
            if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);
            const [like, created] = await NewsCommentLike.findOrCreate({ where: { commentId, userId }, transaction: t });
            if (created) await comment.increment('likesCount', { by: 1, transaction: t });
            else {
                await NewsCommentLike.destroy({ where: { id: like.id }, transaction: t });
                await comment.decrement('likesCount', { by: 1, transaction: t });
            }
            await t.commit();
            const updatedComment = await NewsComment.findByPk(commentId);
            return { isLiked: created, likesCount: updatedComment.likesCount };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async reportComment(commentId, userId, { reason } = {}) {
        const comment = await NewsComment.findByPk(commentId);
        if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);
        try {
            await NewsCommentReport.create({ commentId, userId, reason: reason || 'Nội dung không phù hợp' });
            await comment.increment('reportsCount', { by: 1 });
            return { message: 'Cảm ơn bạn đã báo cáo.' };
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') throw new ErrorResponse('Bạn đã báo cáo bình luận này trước đó', 400);
            throw error;
        }
    }

    static async deleteComment(commentId, userId) {
        const comment = await NewsComment.findByPk(commentId);
        if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);
        if (comment.userId !== userId) throw new ErrorResponse('Bạn không có quyền xóa', 403);
        await comment.update({ content: 'Bình luận này đã bị người dùng xóa', isDeleted: true });
        return { message: 'Đã xóa bình luận' };
    }

    // ==================== CATEGORIES ====================

    static async getCategories({ search, isActive, onlyDeleted } = {}) {
        const where = {};
        if (search) where.name = buildSearchCondition(search, ['name']).name;
        if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
        const queryOptions = { where, order: onlyDeleted ? [['deletedAt', 'DESC']] : [['name', 'ASC']] };
        if (onlyDeleted === true || onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }
        return await NewsCategory.findAll(queryOptions);
    }

    static async getCategoryById(id) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        return category;
    }

    static async createCategory(data) {
        if (!data.slug && data.name) data.slug = NewsService._generateSlug(data.name);
        return await NewsCategory.create(data);
    }

    static async updateCategory(id, data) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        await category.update(data);
        return category;
    }

    static async deleteCategory(id) {
        const category = await NewsCategory.findByPk(id);
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        const newsCount = await News.count({ where: { categoryId: id } });
        if (newsCount > 0) throw new ErrorResponse('Không thể xóa vì chuyên mục còn bài viết', 400);
        await category.destroy();
        return { message: 'Đã xóa chuyên mục' };
    }

    static async restoreCategory(id) {
        const category = await NewsCategory.findByPk(id, { paranoid: false });
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        await category.restore();
        return category;
    }

    static async forceDeleteCategory(id) {
        const category = await NewsCategory.findByPk(id, { paranoid: false });
        if (!category) throw new ErrorResponse('Không tìm thấy chuyên mục', 404);
        const newsCount = await News.count({ where: { categoryId: id }, paranoid: false });
        if (newsCount > 0) throw new ErrorResponse('Vẫn còn bài viết liên quan', 400);
        await category.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn chuyên mục' };
    }

    static _generateSlug(name) {
        return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    }
}

module.exports = NewsService;
