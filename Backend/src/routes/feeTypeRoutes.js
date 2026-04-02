const express = require('express');
const router = express.Router();
const feeTypeController = require('../controllers/feeTypeController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', feeTypeController.getFeeTypes);
router.get('/:id', feeTypeController.getFeeTypeById);
router.post('/', feeTypeController.createFeeType);
router.put('/:id', feeTypeController.updateFeeType);
router.delete('/:id', feeTypeController.deleteFeeType);

module.exports = router;
