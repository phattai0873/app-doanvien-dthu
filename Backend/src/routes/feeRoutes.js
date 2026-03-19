const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadFeeEvidence } = require('../middlewares/uploadMiddleware');

router.use(protect);

router.get('/', feeController.getFees);
router.post('/', uploadFeeEvidence, feeController.createFee);
router.get('/unpaid', feeController.getUnpaidMembers);
router.patch('/:id/status', feeController.updateStatus);
router.delete('/:id', feeController.deleteFee);

module.exports = router;
