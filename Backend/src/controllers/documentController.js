const asyncHandler = require('../utils/asyncHandler');
const DocumentService = require('../services/documentService');

const documentController = {
    getDocuments: asyncHandler(async (req, res) => {
        let { search, categoryId, level, unionBranchId, unionCellId, page, limit } = req.query;

        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            if (isBranchAdmin && req.user.unionBranchId) {
                unionBranchId = req.user.unionBranchId;
            } else if (isCellAdmin && req.user.unionCellId) {
                unionCellId = req.user.unionCellId;
            }
        }

        const result = await DocumentService.getAll({ search, categoryId, level, unionBranchId, unionCellId, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getDocumentById: asyncHandler(async (req, res) => {
        const doc = await DocumentService.getById(req.params.id);
        res.status(200).json({ success: true, data: doc });
    }),

    createDocument: asyncHandler(async (req, res) => {
        const data = req.body;

        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            if (isCellAdmin && req.user.unionCellId) {
                data.unionCellId = req.user.unionCellId;
                data.level = 'CELL';
            } else if (isBranchAdmin && req.user.unionBranchId) {
                data.unionBranchId = req.user.unionBranchId;
                data.level = 'BRANCH';
            }
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
