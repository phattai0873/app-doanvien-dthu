const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id', notificationController.updateNotification);
router.delete('/:id', notificationController.deleteNotification);
router.patch('/:id/send', notificationController.sendNotification);

module.exports = router;
