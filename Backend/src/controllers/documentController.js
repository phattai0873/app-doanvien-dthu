const asyncHandler = require('../utils/asyncHandler');
const DocumentService = require('../services/documentService');

const documentController = {
    getDocuments: asyncHandler(async (req, res) => {
        let { search, categoryId, status, page, limit, unionBranchId } = req.query;
        
        // Scoping for non-admins
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        if (!isSuperAdmin) {
            const member = req.user?.UnionMember;
            const branchId = member?.unionBranchId || member?.UnionCell?.unionBranchId;
            if (branchId) unionBranchId = branchId;
        }

        const result = await DocumentService.getAll({ search, categoryId, status, page, limit, unionBranchId });
        res.status(200).json({ success: true, ...result });
    }),

    getDocumentById: asyncHandler(async (req, res) => {
        const doc = await DocumentService.getById(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    createDocument: asyncHandler(async (req, res) => {
        const data = req.body;
        const doc = await DocumentService.create(data, req.file);
        res.status(201).json({ success: true, data: doc });
    }),

    updateDocument: asyncHandler(async (req, res) => {
        const doc = await DocumentService.update(req.params.id, req.body, req.file);
        res.status(200).json({ success: true, data: doc });
    }),

    deleteDocument: asyncHandler(async (req, res) => {
        const result = await DocumentService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    toggleStatus: asyncHandler(async (req, res) => {
        const doc = await DocumentService.toggleStatus(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    getCategories: asyncHandler(async (req, res) => {
        const categories = await DocumentService.getCategories();
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
    })
};

module.exports = documentController;
