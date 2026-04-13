const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadFeeEvidence } = require('../middlewares/uploadMiddleware');

router.use(protect);

router.get('/', feeController.getFees);
router.get('/my-dashboard', feeController.getMyFeeDashboard);
router.get('/collections', authorize('ADMIN', 'SUPER_ADMIN'), feeController.getCollections);
router.post('/collections', authorize('ADMIN', 'SUPER_ADMIN'), feeController.createCollection);
router.post('/', uploadFeeEvidence, feeController.createFee);
router.get('/unpaid', feeController.getUnpaidMembers);
router.put('/:id', feeController.updateFee);
router.delete('/:id', feeController.deleteFee);

// New Payment Routes
router.post('/init-payment', uploadFeeEvidence, feeController.initPayment);
router.get('/pending', authorize('ADMIN', 'SUPER_ADMIN'), feeController.getPendingTransactions);
router.post('/approve/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.approveTransaction);
router.post('/reject/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.rejectTransaction);
router.post('/bulk-approve', authorize('ADMIN', 'SUPER_ADMIN'), feeController.bulkApproveTransactions);
router.post('/bulk-reject', authorize('ADMIN', 'SUPER_ADMIN'), feeController.bulkRejectTransactions);

// Bank setting
router.get('/bank-setting', feeController.getBankSetting);
router.put('/bank-setting', authorize('ADMIN', 'SUPER_ADMIN'), feeController.updateBankSetting);

module.exports = router;
