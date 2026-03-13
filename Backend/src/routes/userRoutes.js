const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const userValidation = require('../validations/userValidation');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

// Public routes (không cần token)
router.post('/register', validate(userValidation.register), userController.registerUser);
router.post('/login', validate(userValidation.login), userController.loginUser);
router.post('/refresh-token', userController.refreshToken);

// Protected routes (cần Bearer access token)
router.get('/me', protect, userController.getMe);
router.put('/me', protect, uploadAvatar, userController.updateMe);
router.patch('/me/password', protect, userController.changePassword);
router.post('/logout', protect, userController.logout);
router.get('/', protect, userController.getUsers);
router.get('/:id', protect, userController.getUser);
router.put('/:id', protect, uploadAvatar, userController.updateUser);
router.patch('/:id/toggle-lock', protect, userController.toggleLock);
router.patch('/:id/toggle-active', protect, userController.toggleActive);
router.patch('/:id/reset-password', protect, userController.resetPassword);
router.delete('/:id', protect, userController.deleteUser);

module.exports = router;
