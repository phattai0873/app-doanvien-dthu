const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', activityController.getActivities);
router.post('/', activityController.createActivity);
router.get('/member/:memberId/attendance', activityController.getMemberAttendance);
router.get('/:id', activityController.getActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);
router.post('/:id/attendance', activityController.markAttendance);
router.post('/:id/bulk-attendance', activityController.bulkAttendance);

module.exports = router;
