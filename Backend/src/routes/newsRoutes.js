const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { protect, loadUser, checkPermission } = require('../middlewares/authMiddleware');
const { uploadNewsBanner, uploadEditorImage } = require('../middlewares/uploadMiddleware');

// ==================== CHUYÊN MỤC ====================
router.get('/categories', newsController.getCategories);
router.get('/categories/:id', newsController.getCategoryById);
router.post('/categories', protect, checkPermission('category:write'), newsController.createCategory);
router.put('/categories/:id', protect, checkPermission('category:write'), newsController.updateCategory);
router.delete('/categories/:id', protect, checkPermission('category:delete'), newsController.deleteCategory);
router.patch('/categories/:id/restore', protect, checkPermission('category:delete'), newsController.restoreCategory);
router.delete('/categories/:id/force', protect, checkPermission('category:delete'), newsController.forceDeleteCategory);

// ==================== UPLOAD ẢNH EDITOR ====================
// Dùng cho Word editor để upload ảnh vào nội dung bài viết
router.post('/upload-image', protect, uploadEditorImage, newsController.uploadEditorImage);

// ==================== BÀI VIẾT ====================
router.get('/', loadUser, newsController.getNews);
router.post('/', protect, checkPermission('news:create'), uploadNewsBanner, newsController.createNews);
router.get('/:id', loadUser, newsController.getNewsById);
router.put('/:id', protect, checkPermission('news:edit'), uploadNewsBanner, newsController.updateNews);
router.patch('/:id/publish', protect, checkPermission('news:publish'), newsController.publishNews);
router.patch('/:id/unpublish', protect, checkPermission('news:publish'), newsController.unpublishNews);
router.delete('/:id', protect, checkPermission('news:delete'), newsController.deleteNews);
router.patch('/:id/restore', protect, checkPermission('news:delete'), newsController.restoreNews);
router.delete('/:id/force', protect, checkPermission('news:delete'), newsController.forceDeleteNews);

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
