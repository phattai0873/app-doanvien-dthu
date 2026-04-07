const { User, Role, UnionBranch, UnionCell } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const ErrorResponse = require('../utils/errorResponse');
const { safeDate } = require('../utils/dateUtils');


class UserService {
    /**
     * @description Register a new user
     */
    static async register(userData) {
        const username = userData.username?.trim();
        const password = userData.password?.trim();
        const { email, phoneNumber } = userData;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            throw new ErrorResponse('Tên đăng nhập này đã được sử dụng', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Tạo user
        const user = await User.create({
            username,
            passwordHash,
            email,
            phoneNumber,
            isActive: true
        });

        // Gán role mặc định
        const { Role } = require('../models');
        const defaultRole = await Role.findOne({ where: { code: 'MEMBER' } }) || await Role.findOne({ where: { code: 'user' } });
        if (defaultRole) {
            await user.addRole(defaultRole);
        }

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
            message: 'Đăng ký tài khoản thành công. Vui lòng hoàn thiện hồ sơ đoàn viên ở bước tiếp theo.'
        };
    }

    /**
     * @description Login user - trả về cả access token và refresh token
     */
    static async login(username, password) {
        const uName = username?.trim();
        const pWord = password?.trim();
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: uName },
                    { email: uName },
                    { phoneNumber: uName }
                ]
            }
        });

        if (!user || !(await bcrypt.compare(pWord, user.passwordHash))) {
            throw new ErrorResponse('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
        }

        if (!user.isActive) {
            throw new ErrorResponse('Tài khoản chưa được duyệt hoặc đã bị vô hiệu hóa', 403);
        }

        if (user.isLocked) {
            throw new ErrorResponse('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên', 403);
        }

        // Lấy thông tin đầy đủ của user (Roles -> Permissions, UnionMember)
        const userFull = await this.getUserById(user.id);

        // Chuẩn bị payload cho JWT
        const permissions = [];
        let isSuperAdmin = false;

        if (userFull.Roles) {
            userFull.Roles.forEach(role => {
                if (role.code === 'SUPER_ADMIN') isSuperAdmin = true;
                if (role.Permissions) {
                    role.Permissions.forEach(p => {
                        if (!permissions.includes(p.code)) permissions.push(p.code);
                    });
                }
            });
        }

        const scope = {
            branchId: userFull.UnionMember?.UnionCell?.unionBranchId || null,
            cellId: userFull.UnionMember?.unionCellId || null
        };

        const accessToken = generateAccessToken(user.id, {
            permissions,
            isSuperAdmin,
            scope
        });
        const refreshToken = generateRefreshToken(user.id);

        // Lưu hash của refresh token (bảo mật hơn lưu plaintext)
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await user.update({ refreshTokenHash, lastLogin: new Date() });

        return {
            ...userFull,
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

        // Cấp token mới với permissions cập nhật
        const userFull = await this.getUserById(user.id);
        const permissions = [];
        let isSuperAdmin = false;
        if (userFull.Roles) {
            userFull.Roles.forEach(role => {
                if (role.code === 'SUPER_ADMIN') isSuperAdmin = true;
                role.Permissions?.forEach(p => {
                    if (!permissions.includes(p.code)) permissions.push(p.code);
                });
            });
        }
        const scope = {
            branchId: userFull.UnionMember?.UnionCell?.unionBranchId || null,
            cellId: userFull.UnionMember?.unionCellId || null
        };

        const newAccessToken = generateAccessToken(user.id, { permissions, isSuperAdmin, scope });
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
    static async getAllUsers({ onlyDeleted = false } = {}) {
        const queryOptions = {
            attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
            include: [
                { model: Role, through: { attributes: [] } },
                { model: UnionBranch, attributes: ['id', 'name'] },
                { model: UnionCell, attributes: ['id', 'name'] }
            ],
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['username', 'ASC']]
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            queryOptions.where = { deletedAt: { [Op.ne]: null } };
        }

        return await User.findAll(queryOptions);
    }

    /**
     * @description Get user by ID
     */
    static async getUserById(userId) {
        const { Role, UnionMember, UnionCell, UnionBranch } = require('../models');
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
            paranoid: false,
            include: [
                {
                    model: Role,
                    through: { attributes: [] },
                    paranoid: false,
                    include: [{ model: require('../models/Permission'), attributes: ['code'] }]
                },
                {
                    model: UnionMember,
                    paranoid: false,
                    include: [
                        {
                            model: UnionCell,
                            paranoid: false,
                            include: [{ model: UnionBranch, paranoid: false }]
                        }
                    ]
                }
            ]
        });
        const permissions = [];
        let isSuperAdmin = false;

        if (user.Roles) {
            user.Roles.forEach(role => {
                if (role.code === 'SUPER_ADMIN') isSuperAdmin = true;
                if (role.Permissions) {
                    role.Permissions.forEach(p => {
                        if (!permissions.includes(p.code)) permissions.push(p.code);
                    });
                }
            });
        }

        const scope = {
            branchId: user.UnionMember?.UnionCell?.unionBranchId || null,
            cellId: user.UnionMember?.unionCellId || null
        };

        // Chuyển sang object thuần để thêm các trường ảo
        const userData = user.toJSON();
        userData.permissions = permissions;
        userData.isSuperAdmin = isSuperAdmin;
        userData.scope = scope;

        // Add statistics if it's a member
        if (user.UnionMember) {
            const stats = await this.getUserStatistics(user.UnionMember.id);
            userData.statistics = stats;
        }

        return userData;
    }

    /**
     * @description Get statistics for a union member
     */
    static async getUserStatistics(memberId) {
        const { ActivityParticipant, Attendance, QuizAttempt } = require('../models');
        const { Op } = require('sequelize');

        // 1. Total points from activities
        const totalPoints = await ActivityParticipant.sum('scoreAwarded', {
            where: { memberId, attendanceStatus: 'PRESENT' }
        }) || 0;

        // 2. Count of attended meetings
        const meetingsAttended = await Attendance.count({
            where: {
                unionMemberId: memberId,
                status: { [Op.in]: ['PRESENT', 'Có mặt', 'LATE'] }
            }
        });

        // 3. Count of quiz attempts
        const quizCount = await QuizAttempt.count({
            where: { unionMemberId: memberId }
        });

        return {
            totalPoints,
            meetingsAttended,
            quizCount,
            rank: this.calculateRank(totalPoints)
        };
    }

    static calculateRank(points) {
        if (points >= 500) return 'A+';
        if (points >= 300) return 'A';
        if (points >= 150) return 'B+';
        if (points >= 50) return 'B';
        return 'C';
    }
    /**
     * @description Update user info (username, isActive, avatar)
     */
    static async updateUser(userId, data) {
        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);

        const allowed = {};
        if (data.username !== undefined) allowed.username = data.username;
        if (data.email !== undefined) allowed.email = data.email;
        if (data.phoneNumber !== undefined) allowed.phoneNumber = data.phoneNumber;
        if (data.isActive !== undefined) allowed.isActive = data.isActive;
        if (data.avatarUrl !== undefined) {
            allowed.avatar = data.avatarUrl;

            if (user.avatar && user.avatar !== data.avatarUrl) {
                const fs = require('fs');
                const path = require('path');
                try {
                    const oldPath = path.join(__dirname, '../../', user.avatar);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                } catch (e) { console.error('Error removing old avatar:', e); }
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

        const pw = newPassword?.trim();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(pw || '', salt);
        await user.update({ passwordHash, refreshTokenHash: null });
        return { message: 'Đã đặt lại mật khẩu thành công' };
    }

    /**
     * @description Change password for current user
     */
    static async changePassword(userId, oldPassword, newPassword) {
        const oldPw = oldPassword?.trim();
        const newPw = newPassword?.trim();

        if (!oldPw || !newPw) {
            throw new ErrorResponse('Vui lòng cung cấp mật khẩu cũ và mật khẩu mới', 400);
        }

        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);

        const isMatch = await bcrypt.compare(oldPw, user.passwordHash);
        if (!isMatch) {
            throw new ErrorResponse('Mật khẩu cũ không chính xác', 401);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPw, salt);
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
        return { message: 'Đã chuyển tài khoản vào thùng rác' };
    }

    static async restoreUser(userId) {
        const user = await User.findByPk(userId, { paranoid: false });
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng trong thùng rác', 404);
        if (!user.deletedAt) throw new ErrorResponse('Tài khoản này chưa bị xóa', 400);

        await user.restore();
        return user;
    }

    static async forceDeleteUser(userId) {
        const user = await User.findByPk(userId, { paranoid: false });
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);

        // Xóa file avatar vật lý
        if (user.avatar) {
            const fs = require('fs');
            const path = require('path');
            const avatarPath = path.join(__dirname, '../../../', user.avatar); // Fix path depth
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }

        await user.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn tài khoản và các tệp đính kèm' };
    }

    /**
     * @description Assign roles to a user
     * @param {string} userId - ID of the user to assign roles to
     * @param {string[]} roleIds - Array of Role IDs
     * @param {object} currentUser - The user performing the action (req.user)
     */
    static async assignRoles(userId, roleIds, currentUser) {
        if (!userId || !roleIds || !Array.isArray(roleIds)) {
            throw new ErrorResponse('Dữ liệu không hợp lệ', 400);
        }

        const user = await User.findByPk(userId);
        if (!user) throw new ErrorResponse('Không tìm thấy người dùng', 404);

        // Bảo mật: Nếu người thực hiện không phải Super Admin, họ không được gán role SUPER_ADMIN cho bất kỳ ai
        if (!currentUser.isSuperAdmin) {
            const rolesToAssign = await Role.findAll({ where: { id: roleIds } });
            const hasSuperAdminRole = rolesToAssign.some(r => r.code === 'SUPER_ADMIN');
            if (hasSuperAdminRole) {
                throw new ErrorResponse('Chỉ Quản trị viên cấp cao mới có quyền gán vai trò SUPER_ADMIN', 403);
            }
        }

        // Đồng bộ các role
        await user.setRoles(roleIds);

        // Lấy lại user kèm roles mới để trả về
        const updatedUser = await this.getUserById(userId);
        return updatedUser;
    }
}

module.exports = UserService;
