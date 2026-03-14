const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', locationController.getAll);
router.post('/', authorize('ADMIN'), locationController.create);

module.exports = router;
