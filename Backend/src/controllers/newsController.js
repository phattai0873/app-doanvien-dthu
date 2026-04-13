const asyncHandler = require('../utils/asyncHandler');
const NewsService = require('../services/newsService');
const cacheService = require('../services/cacheService');

const newsController = {
    // ==================== BÀI VIẾT ====================

    getNews: asyncHandler(async (req, res) => {
        let { status, categoryId, level, search, page, limit, onlyDeleted } = req.query;

        // Nếu không có quyền quản lý tin tức (news:read), chỉ được xem bài đã xuất bản
        const { hasPermission } = require('../utils/permissionHelper');
        if (!hasPermission(req.user, 'news:read')) {
            status = 'PUBLISHED';
        }

        const result = await NewsService.getAll({ 
            status, 
            categoryId, 
            level, 
            search, 
            page, 
            limit,
            userId: req.user?.id,
            onlyDeleted: onlyDeleted === 'true',
            user: req.user // Tự động xử lý scope trong Service
        });
        res.status(200).json({ success: true, ...result });
    }),

    getNewsById: asyncHandler(async (req, res) => {
        // Truyền user vào để check scope nếu là Admin đang xem nháp
        const news = await NewsService.getById(req.params.id, req.user?.id, req.user);
        res.status(200).json({ success: true, data: news });
    }),

    createNews: asyncHandler(async (req, res) => {
        // Logic gán ID và Level đã được chuyển vào NewsService.injectScope để tập trung bảo mật
        const result = await NewsService.create(req.body, req.user.id, req.file, req.user);
        
        // Invalidate News Cache
        await cacheService.delPattern('__cache__:*:/api/news*');
        
        res.status(201).json({ success: true, data: result });
    }),

    updateNews: asyncHandler(async (req, res) => {
        const result = await NewsService.update(req.params.id, req.body, req.file, req.user);
        await cacheService.delPattern('__cache__:*:/api/news*');
        res.status(200).json({ success: true, data: result });
    }),

    publishNews: asyncHandler(async (req, res) => {
        const { publishedAt } = req.body;
        const news = await NewsService.publish(req.params.id, publishedAt, req.user);
        await cacheService.delPattern('__cache__:*:/api/news*');
        res.status(200).json({ success: true, data: news });
    }),

    unpublishNews: asyncHandler(async (req, res) => {
        const news = await NewsService.unpublish(req.params.id, req.user);
        await cacheService.delPattern('__cache__:*:/api/news*');
        res.status(200).json({ success: true, data: news });
    }),

    deleteNews: asyncHandler(async (req, res) => {
        const result = await NewsService.delete(req.params.id, req.user);
        await cacheService.delPattern('__cache__:*:/api/news*');
        res.status(200).json({ success: true, data: result });
    }),

    restoreNews: asyncHandler(async (req, res) => {
        const result = await NewsService.restore(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteNews: asyncHandler(async (req, res) => {
        const result = await NewsService.forceDelete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    likeNews: asyncHandler(async (req, res) => {
        const result = await NewsService.likeNews(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: result });
    }),

    unlikeNews: asyncHandler(async (req, res) => {
        const result = await NewsService.unlikeNews(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: result });
    }),

    shareNews: asyncHandler(async (req, res) => {
        const result = await NewsService.shareNews(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    // ==================== BÌNH LUẬN ====================

    getComments: asyncHandler(async (req, res) => {
        const { page, limit } = req.query;
        const result = await NewsService.getComments(req.params.id, {
            page,
            limit,
            userId: req.user?.id
        });
        res.status(200).json({ success: true, ...result });
    }),

    getReplies: asyncHandler(async (req, res) => {
        const result = await NewsService.getReplies(req.params.commentId, {
            userId: req.user?.id
        });
        res.status(200).json({ success: true, data: result });
    }),

    createComment: asyncHandler(async (req, res) => {
        const result = await NewsService.createComment(req.params.id, req.user.id, req.body);
        res.status(201).json({ success: true, data: result });
    }),

    likeComment: asyncHandler(async (req, res) => {
        const result = await NewsService.likeComment(req.params.commentId, req.user.id);
        res.status(200).json({ success: true, data: result });
    }),

    reportComment: asyncHandler(async (req, res) => {
        const result = await NewsService.reportComment(req.params.commentId, req.user.id, req.body);
        res.status(200).json({ success: true, data: result });
    }),

    deleteComment: asyncHandler(async (req, res) => {
        const result = await NewsService.deleteComment(req.params.commentId, req.user.id);
        res.status(200).json({ success: true, ...result });
    }),

    // ==================== CHUYÊN MỤC ====================

    getCategories: asyncHandler(async (req, res) => {
        const { search, isActive, onlyDeleted } = req.query;
        const categories = await NewsService.getCategories({ 
            search, 
            isActive, 
            onlyDeleted: onlyDeleted === 'true' 
        });
        res.status(200).json({ success: true, data: categories });
    }),

    getCategoryById: asyncHandler(async (req, res) => {
        const category = await NewsService.getCategoryById(req.params.id);
        res.status(200).json({ success: true, data: category });
    }),

    createCategory: asyncHandler(async (req, res) => {
        const category = await NewsService.createCategory(req.body);
        await cacheService.delPattern('__cache__:*:/api/news/categories*');
        res.status(201).json({ success: true, data: category });
    }),

    updateCategory: asyncHandler(async (req, res) => {
        const category = await NewsService.updateCategory(req.params.id, req.body);
        await cacheService.delPattern('__cache__:*:/api/news/categories*');
        res.status(200).json({ success: true, data: category });
    }),

    deleteCategory: asyncHandler(async (req, res) => {
        const result = await NewsService.deleteCategory(req.params.id);
        await cacheService.delPattern('__cache__:*:/api/news/categories*');
        res.status(200).json({ success: true, data: result });
    }),

    restoreCategory: asyncHandler(async (req, res) => {
        const result = await NewsService.restoreCategory(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteCategory: asyncHandler(async (req, res) => {
        const result = await NewsService.forceDeleteCategory(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    // ==================== UPLOAD ẢNH EDITOR ====================

    uploadEditorImage: asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file ảnh được gửi lên' });
        }
        const imageUrl = `/uploads/images/${req.file.filename}`;
        res.status(200).json({ success: true, url: imageUrl });
    })
};

module.exports = newsController;
