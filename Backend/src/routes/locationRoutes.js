const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', locationController.getAll);
router.post('/', authorize('SUPER_ADMIN'), locationController.create);
router.put('/:id', authorize('SUPER_ADMIN'), locationController.update);
router.delete('/:id', authorize('SUPER_ADMIN'), locationController.delete);

module.exports = router;
