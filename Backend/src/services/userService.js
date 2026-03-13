const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const ErrorResponse = require('../utils/errorResponse');

class UserService {
    /**
     * @description Register a new user
     */
    static async register(userData) {
        const { username, password, fullName, studentId, dateOfBirth, phoneNumber } = userData;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            throw new ErrorResponse('Tên đăng nhập này đã được sử dụng', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Tạo user
        const user = await User.create({ 
            username, 
            passwordHash 
        });

        // Gán role mặc định
        const { UnionMember, Role } = require('../models');
        const defaultRole = await Role.findOne({ where: { code: 'MEMBER' } }) || await Role.findOne({ where: { code: 'user' } });
        if (defaultRole) {
            await user.addRole(defaultRole);
        }

        // Tạo thông tin thẻ đoàn viên với status: 'pending'
        const memberData = {
            userId: user.id,
            fullName: fullName || username,
            memberCode: studentId || `TEMP-${user.id.split('-')[0]}`,
            dateOfBirth: dateOfBirth || '2000-01-01',
            phoneNumber: phoneNumber || null,
            status: 'pending'
        };
        await UnionMember.create(memberData);

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Lưu hash của refresh token vào DB
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await user.update({ refreshTokenHash, lastLogin: new Date() });

        return {
            id: user.id,
            username: user.username,
            accessToken,
            refreshToken,
            message: 'Đăng ký tải khoản và gửi thông tin đoàn viên để duyệt thành công.'
        };
    }

    /**
     * @description Login user - trả về cả access token và refresh token
     */
    static async login(username, password) {
        const user = await User.findOne({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new ErrorResponse('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
        }

        if (!user.isActive) {
            throw new ErrorResponse('Tài khoản chưa được duyệt hoặc đã bị vô hiệu hóa', 403);
        }

        if (user.isLocked) {
            throw new ErrorResponse('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên', 403);
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Lưu hash của refresh token (bảo mật hơn lưu plaintext)
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await user.update({ refreshTokenHash, lastLogin: new Date() });

        // Lấy thông tin đầy đủ của user (Roles, UnionMember) để Frontend load giao diện đúng quyền
        const userFull = await this.getUserById(user.id);

        return {
            ...userFull.toJSON(),
            accessToken,
            refreshToken
        };
    }

    /**
     * @description Cấp lại access token mới bằng refresh token
     */
    static async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new ErrorResponse('Không có refresh token', 401);
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            throw new ErrorResponse('Refresh token không hợp lệ hoặc đã hết hạn', 401);
        }

        const user = await User.findByPk(decoded.id);
        if (!user || !user.refreshTokenHash) {
            throw new ErrorResponse('Refresh token không hợp lệ', 401);
        }

        // So sánh refresh token nhận được với hash đã lưu
        const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isValid) {
            throw new ErrorResponse('Refresh token không hợp lệ', 401);
        }

        // Cấp token mới (Rotation: refresh token cũ bị hủy, cấp mới)
        const newAccessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        await user.update({ refreshTokenHash: newRefreshTokenHash });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    /**
     * @description Logout - xóa refresh token khỏi DB
     */
    static async logout(userId) {
        const user = await User.findByPk(userId);
        if (user) {
            await user.update({ refreshTokenHash: null });
        }
        return { message: 'Đăng xuất thành công' };
    }

    /**
     * @description Get all users
     */
    static async getAllUsers() {
        return await User.findAll({
            attributes: { exclude: ['passwordHash', 'refreshTokenHash'] }
        });
    }

    /**
     * @description Get user by ID
     */
    static async getUserById(userId) {
        const { Role, UnionMember } = require('../models');
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
            include: [
                { model: Role, through: { attributes: [] } },
                { model: UnionMember }
            ]
        });
        if (!user) {
            throw new ErrorResponse('Không tìm thấy người dùng', 404);
        }
        return user;
    }
    /**
     * @description Update user info (username, isActive, avatar)
     */
    static async updateUser(userId, data) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);
        
        const allowed = {};
        if (data.username !== undefined) allowed.username = data.username;
        if (data.isActive !== undefined) allowed.isActive = data.isActive;
        if (data.avatarUrl !== undefined) {
            allowed.avatar = data.avatarUrl;
            
            // Xóa file avatar cũ nếu thay mới hoặc drop avatar
            if (user.avatar && user.avatar !== data.avatarUrl) {
                const fs = require('fs');
                const path = require('path');
                try {
                    const oldPath = path.join(__dirname, '../../', user.avatar);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                } catch(e) { console.error('Error removing old avatar:', e); }
            }
        }

        await user.update(allowed);
        const updated = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash', 'refreshTokenHash'] }
        });
        return updated;
    }

    /**
     * @description Toggle isLocked status
     */
    static async toggleLock(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);
        await user.update({ isLocked: !user.isLocked, refreshTokenHash: !user.isLocked ? null : user.refreshTokenHash });
        return { id: user.id, username: user.username, isLocked: !user.isLocked };
    }

    /**
     * @description Toggle isActive status (approval)
     */
    static async toggleActive(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);
        const newStatus = !user.isActive;
        await user.update({ isActive: newStatus });
        return { id: user.id, username: user.username, isActive: newStatus };
    }

    /**
     * @description Reset password for a user (admin action)
     */
    static async resetPassword(userId, newPassword) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await user.update({ passwordHash, refreshTokenHash: null });
        return { message: 'Đã đặt lại mật khẩu thành công' };
    }

    /**
     * @description Change password for current user
     */
    static async changePassword(userId, oldPassword, newPassword) {
        if (!oldPassword || !newPassword) {
            throw new ErrorResponse('Vui lòng cung cấp mật khẩu cũ và mật khẩu mới', 400);
        }
        
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);

        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new ErrorResponse('Mật khẩu cũ không chính xác', 401);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        // Có thể reset refreshTokenHash để bắt đăng nhập lại ở các thiết bị khác, hoặc không.
        await user.update({ passwordHash, refreshTokenHash: null }); 
        return { message: 'Thay đổi mật khẩu thành công' };
    }

    /**
     * @description Delete user
     */
    static async deleteUser(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);
        await user.destroy();
        return { message: 'Đã xóa tài khoản thành công' };
    }
}

module.exports = UserService;
