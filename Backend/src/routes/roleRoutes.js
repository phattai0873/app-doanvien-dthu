const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

/**
 * Route Quản lý Vai trò và Quyền hạn (RBAC)
 * Toàn bộ yêu cầu quyền: system:config (Quyền cao nhất để sửa cấu hình)
 */

router.use(protect);
router.use(checkPermission('system:config')); // Bảo vệ toàn bộ router

// Danh sách vai trò
router.get('/', roleController.getRoles);

// Danh sách quyền (Permissions) có sẵn để gán
router.get('/permissions', roleController.getPermissions);

// CRUD
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
