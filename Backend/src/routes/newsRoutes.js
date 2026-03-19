const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { protect, loadUser } = require('../middlewares/authMiddleware');
const { uploadNewsBanner, uploadEditorImage } = require('../middlewares/uploadMiddleware');

// ==================== CHUYÊN MỤC ====================
router.get('/categories', newsController.getCategories);
router.get('/categories/:id', newsController.getCategoryById);
router.post('/categories', protect, newsController.createCategory);
router.put('/categories/:id', protect, newsController.updateCategory);
router.delete('/categories/:id', protect, newsController.deleteCategory);

// ==================== UPLOAD ẢNH EDITOR ====================
// Dùng cho Word editor để upload ảnh vào nội dung bài viết
router.post('/upload-image', protect, uploadEditorImage, newsController.uploadEditorImage);

// ==================== BÀI VIẾT ====================
router.get('/', loadUser, newsController.getNews);
router.post('/', protect, uploadNewsBanner, newsController.createNews);
router.get('/:id', newsController.getNewsById);
router.put('/:id', protect, uploadNewsBanner, newsController.updateNews);
router.patch('/:id/publish', protect, newsController.publishNews);
router.patch('/:id/unpublish', protect, newsController.unpublishNews);
router.delete('/:id', protect, newsController.deleteNews);

module.exports = router;
