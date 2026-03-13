const UserService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const userController = {
    /**
     * @route GET /api/users
     */
    getUsers: asyncHandler(async (req, res) => {
        const users = await UserService.getAllUsers();
        res.status(200).json({ success: true, count: users.length, data: users });
    }),

    /**
     * @route GET /api/users/:id
     */
    getUser: asyncHandler(async (req, res) => {
        const user = await UserService.getUserById(req.params.id);
        res.status(200).json({ success: true, data: user });
    }),

    /**
     * @route POST /api/users/register
     */
    registerUser: asyncHandler(async (req, res) => {
        const data = await UserService.register(req.body);
        res.status(201).json({ success: true, data });
    }),

    /**
     * @route POST /api/users/login
     */
    loginUser: asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        const data = await UserService.login(username, password);
        res.status(200).json({ success: true, data });
    }),

    /**
     * @route POST /api/users/refresh-token
     * Body: { refreshToken }
     */
    refreshToken: asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        const tokens = await UserService.refreshToken(refreshToken);
        res.status(200).json({ success: true, data: tokens });
    }),

    /**
     * @route POST /api/users/logout
     * Yêu cầu Bearer token (để biết ai đang logout)
     */
    logout: asyncHandler(async (req, res) => {
        const result = await UserService.logout(req.user.id);
        res.status(200).json({ success: true, data: result });
    }),

    /**
     * @route GET /api/users/me
     * Xem thông tin bản thân
     */
    getMe: asyncHandler(async (req, res) => {
        const user = await UserService.getUserById(req.user.id);
        res.status(200).json({ success: true, data: user });
    }),

    /**
     * @route PUT /api/users/me
     * Cập nhật thông tin bản thân (VD: avatar)
     */
    updateMe: asyncHandler(async (req, res) => {
        let updateData = {};
        
        // Xử lý avatar: nếu có up file (avatar)
        if (req.file) {
            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }
        
        // Nếu client gửi cờ xóa avatar
        if (req.body.removeAvatar === 'true' || req.body.removeAvatar === true) {
            updateData.avatarUrl = null;
        }

        const user = await UserService.updateUser(req.user.id, updateData);
        res.status(200).json({ success: true, data: user });
    }),

    /**
     * @route PATCH /api/users/me/password
     * Đổi mật khẩu cho người dùng hiện tại
     */
    changePassword: asyncHandler(async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const result = await UserService.changePassword(req.user.id, oldPassword, newPassword);
        res.status(200).json({ success: true, data: result });
    }),

    /**
     * @route PUT /api/users/:id
     * Hỗ trợ cập nhật avatar (nếu có multipart form-data)
     */
    updateUser: asyncHandler(async (req, res) => {
        let updateData = { ...req.body };
        
        // Xử lý avatar: nếu có up file (avatar)
        if (req.file) {
            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }
        
        // Nếu có cờ xóa avatar cũ từ client gửi lên
        if (req.body.removeAvatar === 'true' || req.body.removeAvatar === true) {
            updateData.avatarUrl = null;
        }

        const user = await UserService.updateUser(req.params.id, updateData);
        res.status(200).json({ success: true, data: user });
    }),

    /**
     * @route PATCH /api/users/:id/toggle-lock
     */
    toggleLock: asyncHandler(async (req, res) => {
        const result = await UserService.toggleLock(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    /**
     * @route PATCH /api/users/:id/toggle-active
     * Duyệt tài khoản
     */
    toggleActive: asyncHandler(async (req, res) => {
        const result = await UserService.toggleActive(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    /**
     * @route PATCH /api/users/:id/reset-password
     * Body: { newPassword }
     */
    resetPassword: asyncHandler(async (req, res) => {
        const result = await UserService.resetPassword(req.params.id, req.body.newPassword);
        res.status(200).json({ success: true, data: result });
    }),

    /**
     * @route DELETE /api/users/:id
     */
    deleteUser: asyncHandler(async (req, res) => {
        const result = await UserService.deleteUser(req.params.id);
        res.status(200).json({ success: true, data: result });
    })
};

module.exports = userController;
