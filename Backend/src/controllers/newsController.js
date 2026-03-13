const asyncHandler = require('../utils/asyncHandler');
const NewsService = require('../services/newsService');

const newsController = {
    // ==================== BÀI VIẾT ====================

    getNews: asyncHandler(async (req, res) => {
        let { status, categoryId, scope, unionBranchId, search, page, limit } = req.query;

        // Phân quyền: Thấy tin tức của khoa mình + tin tức chung toàn trường
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await NewsService.getAll({ status, categoryId, scope, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getNewsById: asyncHandler(async (req, res) => {
        const news = await NewsService.getById(req.params.id);
        res.status(200).json({ success: true, data: news });
    }),

    createNews: asyncHandler(async (req, res) => {
        const data = req.body;

        // Tự động gán khoa nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.unionBranchId = userUnionMember.unionBranchId;
        }

        const news = await NewsService.create(data, req.user.id, req.file);
        res.status(201).json({ success: true, data: news });
    }),

    updateNews: asyncHandler(async (req, res) => {
        const news = await NewsService.update(req.params.id, req.body, req.file);
        res.status(200).json({ success: true, data: news });
    }),

    publishNews: asyncHandler(async (req, res) => {
        const news = await NewsService.publish(req.params.id);
        res.status(200).json({ success: true, data: news });
    }),

    unpublishNews: asyncHandler(async (req, res) => {
        const news = await NewsService.unpublish(req.params.id);
        res.status(200).json({ success: true, data: news });
    }),

    deleteNews: asyncHandler(async (req, res) => {
        const result = await NewsService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    // ==================== CHUYÊN MỤC ====================

    getCategories: asyncHandler(async (req, res) => {
        const { search, isActive } = req.query;
        const categories = await NewsService.getCategories({ search, isActive });
        res.status(200).json({ success: true, data: categories });
    }),

    getCategoryById: asyncHandler(async (req, res) => {
        const category = await NewsService.getCategoryById(req.params.id);
        res.status(200).json({ success: true, data: category });
    }),

    createCategory: asyncHandler(async (req, res) => {
        const category = await NewsService.createCategory(req.body);
        res.status(201).json({ success: true, data: category });
    }),

    updateCategory: asyncHandler(async (req, res) => {
        const category = await NewsService.updateCategory(req.params.id, req.body);
        res.status(200).json({ success: true, data: category });
    }),

    deleteCategory: asyncHandler(async (req, res) => {
        const result = await NewsService.deleteCategory(req.params.id);
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
