const { News, NewsCategory, User, NewsLike, NewsComment, NewsCommentLike, NewsCommentReport } = require('../models');
const { Op, literal } = require('sequelize');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const fs = require('fs');
const path = require('path');

class NewsService {
    static async getAll({ status, categoryId, level, scope, unionBranchId, unionCellId, search, page, limit, userId, onlyDeleted } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const where = {
            ...buildSearchCondition(search, ['title', 'summary']),
            ...(status && { status }),
            ...(categoryId && { categoryId }),
            ...(level && { level }),
            ...(scope && { scope })
        };

        if (unionCellId) {
            where.unionCellId = unionCellId;
        } else if (unionBranchId) {
            where[Op.and] = [
                { unionBranchId },
                { level: { [Op.ne]: 'CELL' } }
            ];
        }

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

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const result = await News.findAndCountAll(queryOptions);

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id, userId = null) {
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
        
        // Tăng lượt xem
        await news.increment('viewsCount');
        
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

    static async publish(id, publishedAt = null) {
        const news = await News.findByPk(id);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);
        await news.update({
            status: 'PUBLISHED',
            publishedAt: publishedAt || news.publishedAt || new Date()
        });
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

        await news.destroy();
        return { message: 'Đã chuyển bài viết vào thùng rác' };
    }

    static async restore(id) {
        const news = await News.findByPk(id, { paranoid: false });
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết trong thùng rác', 404);
        if (!news.deletedAt) throw new ErrorResponse('Bài viết này chưa bị xóa', 400);

        // Kiểm tra xem chuyên mục của bài viết có bị xóa không
        if (news.categoryId) {
            const category = await NewsCategory.findByPk(news.categoryId, { paranoid: false });
            if (category && category.deletedAt) {
                throw new ErrorResponse('Không thể khôi phục vì chuyên mục của bài viết này đang bị xóa. Hãy khôi phục chuyên mục trước.', 400);
            }
        }

        await news.restore();
        return news;
    }

    static async forceDelete(id) {
        const news = await News.findByPk(id, { paranoid: false });
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);

        // Xóa file banner vật lý
        if (news.bannerUrl) {
            const bannerPath = path.join(__dirname, '../../../', news.bannerUrl); // Fix path depth
            if (fs.existsSync(bannerPath)) {
                fs.unlinkSync(bannerPath);
            }
        }

        await news.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn bài viết và các tệp đính kèm' };
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

    /**
     * Lấy danh sách bình luận gốc của bài viết (Phân trang)
     */
    static async getComments(newsId, { page, limit, userId } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const result = await NewsComment.findAndCountAll({
            where: {
                newsId,
                parentId: null, // Chỉ lấy bình luận gốc
                status: 'VISIBLE'
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'avatar']
                }
            ],
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

    /**
     * Lấy danh sách câu trả lời của một bình luận (Lazy load)
     */
    static async getReplies(commentId, { userId } = {}) {
        return await NewsComment.findAll({
            where: {
                parentId: commentId,
                status: 'VISIBLE'
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'avatar']
                }
            ],
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

    /**
     * Tạo bình luận mới hoặc phản hồi (Giới hạn 1 cấp lồng nhau)
     */
    static async createComment(newsId, userId, { content, parentId } = {}) {
        if (!content || content.trim() === '') throw new ErrorResponse('Nội dung bình luận không được để trống', 400);

        // Kiểm tra bài viết tồn tại
        const news = await News.findByPk(newsId);
        if (!news) throw new ErrorResponse('Không tìm thấy bài viết', 404);

        // Nếu là phản hồi, kiểm tra bình luận cha
        if (parentId) {
            const parent = await NewsComment.findByPk(parentId);
            if (!parent) throw new ErrorResponse('Không tìm thấy bình luận gốc', 404);
            
            // Chỉ cho phép trả lời 1 cấp (Best practice)
            if (parent.parentId !== null) {
                throw new ErrorResponse('Hệ thống chỉ hỗ trợ trả lời bình luận cấp 1', 400);
            }
        }

        return await NewsComment.create({
            newsId,
            userId,
            content: content.trim(),
            parentId: parentId || null
        });
    }

    /**
     * Thích/Bỏ thích bình luận (Sử dụng Transaction để đảm bảo tính nhất quán)
     */
    static async likeComment(commentId, userId) {
        const { sequelize } = require('../configs/db');
        const t = await sequelize.transaction();

        try {
            const comment = await NewsComment.findByPk(commentId, { transaction: t });
            if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);

            const [like, created] = await NewsCommentLike.findOrCreate({
                where: { commentId, userId },
                transaction: t
            });

            if (created) {
                await comment.increment('likesCount', { by: 1, transaction: t });
            } else {
                await NewsCommentLike.destroy({ where: { id: like.id }, transaction: t });
                await comment.decrement('likesCount', { by: 1, transaction: t });
            }

            await t.commit();
            
            // Lấy lại giá trị likes mới nhất sau transaction
            const updatedComment = await NewsComment.findByPk(commentId);
            return { isLiked: created, likesCount: updatedComment.likesCount };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Báo cáo vi phạm bình luận
     */
    static async reportComment(commentId, userId, { reason } = {}) {
        const comment = await NewsComment.findByPk(commentId);
        if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);

        try {
            await NewsCommentReport.create({
                commentId,
                userId,
                reason: reason || 'Nội dung không phù hợp'
            });

            await comment.increment('reportsCount', { by: 1 });
            return { message: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bình luận này.' };
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new ErrorResponse('Bạn đã báo cáo bình luận này trước đó', 400);
            }
            throw error;
        }
    }

    /**
     * Xóa bình luận (Option A: Soft delete giả - thay đổi nội dung)
     */
    static async deleteComment(commentId, userId) {
        const comment = await NewsComment.findByPk(commentId);
        if (!comment) throw new ErrorResponse('Không tìm thấy bình luận', 404);

        if (comment.userId !== userId) {
            throw new ErrorResponse('Bạn không có quyền xóa bình luận của người khác', 403);
        }

        // Thay đổi nội dung bình luận để giữ context cho các phản hồi
        await comment.update({
            content: 'Bình luận này đã bị người dùng xóa',
            isDeleted: true
        });

        return { message: 'Đã xóa bình luận' };
    }

    // ==================== CATEGORIES ====================

    static async getCategories({ search, isActive, onlyDeleted } = {}) {
        const where = {};
        if (search) where.name = buildSearchCondition(search, ['name']).name;
        if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

        const queryOptions = {
            where,
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['name', 'ASC']],
            attributes: ['id', 'name', 'slug', 'description', 'isActive', 'createdAt']
        };

        if (onlyDeleted) {
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

        // Kiểm tra chuyên mục có bài viết đang hoạt động không
        const newsCount = await News.count({ where: { categoryId: id } });
        if (newsCount > 0) {
            throw new ErrorResponse(
                `Không thể xóa chuyên mục vì có ${newsCount} bài viết đang hoạt động thuộc chuyên mục này`,
                400
            );
        }

        await category.destroy();
        return { message: 'Đã chuyển chuyên mục vào thùng rác' };
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
        
        // Kiểm tra xem có bài viết nào (kể cả đã xóa mềm) thuộc chuyên mục này không
        const newsCount = await News.count({ where: { categoryId: id }, paranoid: false });
        if (newsCount > 0) {
            throw new ErrorResponse(`Không thể xóa vĩnh viễn chuyên mục vì vẫn còn ${newsCount} bài viết liên quan.`, 400);
        }

        await category.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn chuyên mục' };
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
