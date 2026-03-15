const express = require('express');
const router = express.Router();
const { getPositions } = require('../controllers/positionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getPositions);

module.exports = router;
