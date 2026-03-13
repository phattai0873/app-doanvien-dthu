const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadBanner } = require('../middlewares/uploadMiddleware');

// Public: Lấy danh sách banner (cho Mobile App)
router.get('/', bannerController.getAllBanners);

// Admin: CRUD banner
router.post('/', protect, uploadBanner, bannerController.createBanner);
router.patch('/:id/toggle', protect, bannerController.toggleBanner);
router.delete('/:id', protect, bannerController.deleteBanner);

module.exports = router;
