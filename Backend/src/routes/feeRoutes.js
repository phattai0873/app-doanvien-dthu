const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', feeController.getFees);
router.post('/', feeController.createFee);
router.get('/unpaid', feeController.getUnpaidMembers);
router.delete('/:id', feeController.deleteFee);

module.exports = router;
