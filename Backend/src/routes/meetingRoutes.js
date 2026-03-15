const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', meetingController.getMeetings);
router.post('/', meetingController.createMeeting);
router.get('/:id', meetingController.getMeeting);
router.put('/:id', meetingController.updateMeeting);
router.patch('/:id/status', meetingController.updateStatus);
router.delete('/:id', meetingController.deleteMeeting);

// Điểm danh
router.get('/:id/attendance', meetingController.getAttendance);
router.post('/:id/check-in', meetingController.checkIn);
router.post('/:id/refresh-code', meetingController.refreshCheckinCode);

module.exports = router;
