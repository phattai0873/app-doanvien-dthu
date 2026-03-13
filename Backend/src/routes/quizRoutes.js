const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadQuizThumbnail } = require('../middlewares/uploadMiddleware');

router.use(protect);

router.get('/', quizController.getExams);
router.post('/', uploadQuizThumbnail, quizController.createExam);
router.get('/:id', quizController.getExam);
router.post('/:id/submit', quizController.submitAttempt);
router.get('/:id/attempts', quizController.getAttempts);

module.exports = router;
