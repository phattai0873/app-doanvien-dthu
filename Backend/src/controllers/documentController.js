const asyncHandler = require('../utils/asyncHandler');
const DocumentService = require('../services/documentService');

const documentController = {
    getDocuments: asyncHandler(async (req, res) => {
        let { search, categoryId, status, page, limit, unionBranchId, onlyDeleted } = req.query;
 
        // Logic ẩn/hiện văn bản dựa trên quyền: Nếu không có quyền đọc (document:read), chỉ thấy bài PUBLIC
        const { hasPermission } = require('../utils/permissionHelper');
        if (!hasPermission(req.user, 'document:read')) {
            status = 'PUBLISH';
        }

        const result = await DocumentService.getAll({ 
            search, 
            categoryId, 
            status, 
            page, 
            limit, 
            unionBranchId, 
            onlyDeleted: onlyDeleted === 'true',
            user: req.user // Tự động xử lý scope trong Service
        });
        res.status(200).json({ success: true, ...result });
    }),

    getDocumentById: asyncHandler(async (req, res) => {
        const doc = await DocumentService.getById(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    createDocument: asyncHandler(async (req, res) => {
        const doc = await DocumentService.create(req.body, req.file, req.user);
        res.status(201).json({ success: true, data: doc });
    }),

    updateDocument: asyncHandler(async (req, res) => {
        const doc = await DocumentService.update(req.params.id, req.body, req.file, req.user);
        res.status(200).json({ success: true, data: doc });
    }),

    deleteDocument: asyncHandler(async (req, res) => {
        const result = await DocumentService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    restoreDocument: asyncHandler(async (req, res) => {
        const result = await DocumentService.restoreDocument(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteDocument: asyncHandler(async (req, res) => {
        const result = await DocumentService.forceDeleteDocument(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    toggleStatus: asyncHandler(async (req, res) => {
        const doc = await DocumentService.toggleStatus(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    getCategories: asyncHandler(async (req, res) => {
        const categories = await DocumentService.getCategories({ 
            onlyDeleted: req.query.onlyDeleted === 'true' 
        });
        res.status(200).json({ success: true, data: categories });
    }),

    createCategory: asyncHandler(async (req, res) => {
        const category = await DocumentService.createCategory(req.body);
        res.status(201).json({ success: true, data: category });
    }),

    updateCategory: asyncHandler(async (req, res) => {
        const category = await DocumentService.updateCategory(req.params.id, req.body);
        res.status(200).json({ success: true, data: category });
    }),

    deleteCategory: asyncHandler(async (req, res) => {
        const result = await DocumentService.deleteCategory(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    restoreCategory: asyncHandler(async (req, res) => {
        const result = await DocumentService.restoreCategory(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteCategory: asyncHandler(async (req, res) => {
        const result = await DocumentService.forceDeleteCategory(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = documentController;
