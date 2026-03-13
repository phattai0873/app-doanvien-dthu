const asyncHandler = require('../utils/asyncHandler');
const DocumentService = require('../services/documentService');

const documentController = {
    getDocuments: asyncHandler(async (req, res) => {
        let { search, categoryId, unionBranchId, page, limit } = req.query;

        // Phân quyền: Thấy văn bản của khoa mình + văn bản chung toàn trường
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await DocumentService.getAll({ search, categoryId, unionBranchId, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getDocumentById: asyncHandler(async (req, res) => {
        const doc = await DocumentService.getById(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    createDocument: asyncHandler(async (req, res) => {
        const data = req.body;

        // Tự động gán khoa nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.unionBranchId = userUnionMember.unionBranchId;
        }

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

    getCategories: asyncHandler(async (req, res) => {
        const categories = await DocumentService.getCategories();
        res.status(200).json({ success: true, data: categories });
    })
};

module.exports = documentController;
