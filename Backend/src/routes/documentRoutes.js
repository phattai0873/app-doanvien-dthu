const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect, loadUser } = require('../middlewares/authMiddleware');
const { uploadDocument } = require('../middlewares/uploadMiddleware');

router.get('/categories', documentController.getCategories);
router.get('/', loadUser, documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);

// Protected routes
router.use(protect);
router.post('/categories', documentController.createCategory);
router.put('/categories/:id', documentController.updateCategory);
router.delete('/categories/:id', documentController.deleteCategory);
router.patch('/:id/toggle-status', documentController.toggleStatus);
router.post('/', uploadDocument, documentController.createDocument);
router.put('/:id', uploadDocument, documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
