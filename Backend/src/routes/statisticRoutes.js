const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statisticController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

router.use(protect);

router.get('/dashboard', checkPermission('system:read'), cacheMiddleware({ ttl: 900 }), statisticController.getDashboard);
router.get('/members', checkPermission('member:read'), cacheMiddleware({ ttl: 900 }), statisticController.getMembers);
router.get('/rankings', checkPermission('system:read'), cacheMiddleware({ ttl: 900 }), statisticController.getRankings);

module.exports = router;
