const express = require('express');
const router = express.Router();
const landingController = require('../controllers/landingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public route: Lấy cấu hình Landing Page
router.get('/config', landingController.getConfigs);

// Admin routes: Cập nhật cấu hình
router.put('/config', protect, authorize('SUPER_ADMIN'), landingController.updateConfig);
router.post('/seed', protect, authorize('SUPER_ADMIN'), landingController.seedConfigs);

module.exports = router;
