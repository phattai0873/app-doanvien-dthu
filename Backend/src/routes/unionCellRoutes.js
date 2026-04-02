const express = require('express');
const router = express.Router();
const unionCellController = require('../controllers/unionCellController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', unionCellController.getCells);
router.get('/my', unionCellController.getMyCell);
router.post('/', unionCellController.createCell);
router.get('/:id', unionCellController.getCell);
router.put('/:id', unionCellController.updateCell);
router.delete('/:id', unionCellController.deleteCell);
router.patch('/:id/restore', unionCellController.restoreCell);
router.delete('/:id/force', unionCellController.forceDeleteCell);

module.exports = router;
