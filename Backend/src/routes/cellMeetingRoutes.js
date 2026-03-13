const express = require('express');
const router = express.Router();
const cellMeetingController = require('../controllers/cellMeetingController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', cellMeetingController.getMeetings);
router.post('/', cellMeetingController.createMeeting);
router.get('/:id', cellMeetingController.getMeeting);
router.put('/:id', cellMeetingController.updateMeeting);
router.patch('/:id/status', cellMeetingController.updateStatus);
router.delete('/:id', cellMeetingController.deleteMeeting);

module.exports = router;
