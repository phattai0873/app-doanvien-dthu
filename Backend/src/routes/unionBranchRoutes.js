const express = require('express');
const router = express.Router();
const unionBranchController = require('../controllers/unionBranchController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', unionBranchController.getBranches);
router.get('/stats', unionBranchController.getBranchStats);
router.get('/:id/stats', unionBranchController.getBranchStats);
router.post('/', unionBranchController.createBranch);
router.get('/:id', unionBranchController.getBranch);
router.put('/:id', unionBranchController.updateBranch);
router.delete('/:id', unionBranchController.deleteBranch);

module.exports = router;
