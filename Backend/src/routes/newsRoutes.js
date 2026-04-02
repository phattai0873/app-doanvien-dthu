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
router.patch('/categories/:id/restore', protect, newsController.restoreCategory);
router.delete('/categories/:id/force', protect, newsController.forceDeleteCategory);

// ==================== UPLOAD ẢNH EDITOR ====================
// Dùng cho Word editor để upload ảnh vào nội dung bài viết
router.post('/upload-image', protect, uploadEditorImage, newsController.uploadEditorImage);

// ==================== BÀI VIẾT ====================
router.get('/', loadUser, newsController.getNews);
router.post('/', protect, uploadNewsBanner, newsController.createNews);
router.get('/:id', loadUser, newsController.getNewsById);
router.put('/:id', protect, uploadNewsBanner, newsController.updateNews);
router.patch('/:id/publish', protect, newsController.publishNews);
router.patch('/:id/unpublish', protect, newsController.unpublishNews);
router.delete('/:id', protect, newsController.deleteNews);
router.patch('/:id/restore', protect, newsController.restoreNews);
router.delete('/:id/force', protect, newsController.forceDeleteNews);

// Like & Share
router.post('/:id/like', protect, newsController.likeNews);
router.post('/:id/unlike', protect, newsController.unlikeNews);
router.post('/:id/share', newsController.shareNews);

// Comments
router.get('/:id/comments', newsController.getComments);
router.get('/comments/:commentId/replies', newsController.getReplies);
router.post('/:id/comments', protect, newsController.createComment);
router.post('/comments/:commentId/like', protect, newsController.likeComment);
router.post('/comments/:commentId/report', protect, newsController.reportComment);
router.delete('/comments/:commentId', protect, newsController.deleteComment);

module.exports = router;
