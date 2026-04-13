const express = require('express');
const router = express.Router();
const unionBranchController = require('../controllers/unionBranchController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/all', unionBranchController.getBranchesAll);
router.get('/', checkPermission('branch:read'), unionBranchController.getBranches);
router.get('/stats', checkPermission('branch:read'), unionBranchController.getBranchStats);
router.get('/my', unionBranchController.getMyBranch); // Mọi người dùng đều xem được khoa của chính mình
router.get('/:id/stats', checkPermission('branch:read'), unionBranchController.getBranchStats);
router.post('/', checkPermission('branch:create'), unionBranchController.createBranch);
router.get('/:id', checkPermission('branch:read'), unionBranchController.getBranch);
router.put('/:id', checkPermission('branch:update'), unionBranchController.updateBranch);
router.delete('/:id', checkPermission('branch:delete'), unionBranchController.deleteBranch);
router.patch('/:id/restore', checkPermission('branch:delete'), unionBranchController.restoreBranch);
router.delete('/:id/force', checkPermission('branch:delete'), unionBranchController.forceDeleteBranch);

module.exports = router;
