const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect, loadUser, checkPermission } = require('../middlewares/authMiddleware');
const { uploadDocument } = require('../middlewares/uploadMiddleware');

router.get('/categories', documentController.getCategories);
router.get('/', loadUser, documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);

// Protected routes
router.post('/categories', protect, checkPermission('category:write'), documentController.createCategory);
router.put('/categories/:id', protect, checkPermission('category:write'), documentController.updateCategory);
router.delete('/categories/:id', protect, checkPermission('category:delete'), documentController.deleteCategory);
router.patch('/categories/:id/restore', protect, checkPermission('category:delete'), documentController.restoreCategory);
router.delete('/categories/:id/force', protect, checkPermission('category:delete'), documentController.forceDeleteCategory);

router.post('/', protect, checkPermission('document:create'), uploadDocument, documentController.createDocument);
router.put('/:id', protect, checkPermission('document:edit'), uploadDocument, documentController.updateDocument);
router.patch('/:id/toggle-status', protect, checkPermission('document:edit'), documentController.toggleStatus);
router.delete('/:id', protect, checkPermission('document:delete'), documentController.deleteDocument);
router.patch('/:id/restore', protect, checkPermission('document:delete'), documentController.restoreDocument);
router.delete('/:id/force', protect, checkPermission('document:delete'), documentController.forceDeleteDocument);

module.exports = router;
