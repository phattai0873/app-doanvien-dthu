const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', activityController.getActivities);
router.get('/summary', activityController.getSummary);
router.post('/', activityController.createActivity);
router.get('/:id', activityController.getActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

// Phê duyệt
router.patch('/:id/approve', activityController.approveActivity);

// Đăng ký tham gia
router.post('/:id/register', activityController.registerParticipant);
router.patch('/:id/participants/:memberId', activityController.updateParticipant);

// Điểm danh (Tương thích ngược hoặc bổ sung)
router.post('/:id/check-in', activityController.checkIn);
router.post('/:id/refresh-code', activityController.refreshCheckinCode);
router.post('/:id/attendance', activityController.markAttendance);
router.post('/:id/bulk-attendance', activityController.bulkAttendance);
router.get('/member/:memberId/attendance', activityController.getMemberAttendance);

module.exports = router;
