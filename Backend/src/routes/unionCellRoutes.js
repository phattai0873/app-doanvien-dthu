const express = require('express');
const router = express.Router();
const unionCellController = require('../controllers/unionCellController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/all', unionCellController.getCellsAll);
router.get('/', checkPermission('cell:read'), unionCellController.getCells);
router.get('/my', unionCellController.getMyCell); // Cho phép đoàn viên xem chi đoàn của chính mình
router.post('/', checkPermission('cell:create'), unionCellController.createCell);
router.get('/:id', checkPermission('cell:read'), unionCellController.getCell);
router.put('/:id', checkPermission('cell:update'), unionCellController.updateCell);
router.delete('/:id', checkPermission('cell:delete'), unionCellController.deleteCell);
router.patch('/:id/restore', checkPermission('cell:delete'), unionCellController.restoreCell);
router.delete('/:id/force', checkPermission('cell:delete'), unionCellController.forceDeleteCell);

module.exports = router;
