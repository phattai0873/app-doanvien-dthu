const { User, Role, UnionBranch, UnionCell } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const ErrorResponse = require('../utils/errorResponse');
const { safeDate } = require('../utils/dateUtils');


class UserService {
    /**
     * @description Tra cứu mã đoàn viên (bị che) để hỗ trợ đăng ký
     */
    static async lookupMemberCode(query) {
        const { fullName, dateOfBirth, unionCellId } = query;
        if (!fullName || !dateOfBirth) {
            throw new ErrorResponse('Vui lòng cung cấp Họ tên và Ngày sinh', 400);
        }

        const { UnionMember } = require('../models');
        const members = await UnionMember.findAll({
            where: {
                fullName: fullName.trim(),
                dateOfBirth: safeDate(dateOfBirth),
                ...(unionCellId ? { unionCellId } : {})
            },
            attributes: ['memberCode', 'fullName']
        });

        if (members.length === 0) {
            throw new ErrorResponse('Không tìm thấy thông tin đoàn viên phù hợp', 404);
        }

        // Masking memberCode: DV2024001 -> DV****001
        return members.map(m => {
            const code = m.memberCode;
            const masked = code.length > 5 
                ? `${code.substring(0, 2)}****${code.substring(code.length - 3)}`
                : `${code.substring(0, 1)}***`;
            return {
                fullName: m.fullName,
                memberCodeMasked: masked
            };
        });
    }

    /**
     * @description Register and Activate a new user linked to a UnionMember
     */
    static async register(userData) {
        const { username, password, email, phoneNumber, memberCode, dateOfBirth } = userData;

        if (!username || !password || !memberCode || !dateOfBirth) {
            throw new ErrorResponse('Vui lòng điền đầy đủ các thông tin bắt buộc', 400);
        }

        // 1. Kiểm tra User trùng lặp
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username.trim() },
                    ...(email ? [{ email: email.trim() }] : []),
                    ...(phoneNumber ? [{ phoneNumber: phoneNumber.trim() }] : [])
                ]
            }
        });

        if (existingUser) {
            if (existingUser.username === username.trim()) throw new ErrorResponse('Tên đăng nhập này đã được sử dụng', 400);
            if (email && existingUser.email === email.trim()) throw new ErrorResponse('Email này đã được sử dụng', 400);
            if (phoneNumber && existingUser.phoneNumber === phoneNumber.trim()) throw new ErrorResponse('Số điện thoại này đã được sử dụng', 400);
        }

        const { sequelize } = require('../configs/db');
        const { UnionMember, UnionMemberHistory, AuditLog, Role, Permission } = require('../models');
        const t = await sequelize.transaction();

        try {
            // 2. Tìm và Khóa hàng hồ sơ Đoàn viên (Tránh Race Condition)
            const member = await UnionMember.findOne({
                where: { memberCode: memberCode.trim() },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!member) {
                await t.rollback();
                throw new ErrorResponse('Mã đoàn viên không tồn tại trên hệ thống', 404);
            }

            // 3. Chống Brute-force
            if (member.lockedUntil && new Date(member.lockedUntil) > new Date()) {
                const waitTime = Math.ceil((new Date(member.lockedUntil) - new Date()) / 60000);
                await t.rollback();
                throw new ErrorResponse(`Hồ sơ này đang bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau ${waitTime} phút.`, 403);
            }

            if (member.userId || member.isActivated) {
                await t.rollback();
                throw new ErrorResponse('Hồ sơ đoàn viên này đã được kích hoạt tài khoản', 400);
            }

            // 4. Xác minh Ngày sinh (Yếu tố thứ 2)
            const inputDob = safeDate(dateOfBirth);
            if (member.dateOfBirth !== inputDob) {
                const newFailed = (member.failedAttempts || 0) + 1;
                const updateData = { failedAttempts: newFailed };
                
                if (newFailed >= 5) {
                    updateData.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // Khóa 5 phút
                    updateData.failedAttempts = 0;
                }
                
                await member.update(updateData, { transaction: t });
                await t.commit();
                throw new ErrorResponse('Thông tin Ngày sinh không khớp với hồ sơ gốc', 400);
            }

            // 5. Tạo User
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password.trim(), salt);
            
            const user = await User.create({
                username: username.trim(),
                passwordHash,
                email: email?.trim(),
                phoneNumber: phoneNumber?.trim(),
                isActive: true
            }, { transaction: t });

            // 6. Gán Role & Permission
            const defaultRole = await Role.findOne({ where: { code: 'MEMBER' }, transaction: t }) 
                             || await Role.findOne({ where: { code: 'user' }, transaction: t });
            
            const permissions = [];
            if (defaultRole) {
                await user.addRole(defaultRole, { transaction: t });
                const roleWithPerms = await Role.findByPk(defaultRole.id, {
                    include: [{ model: Permission, attributes: ['code'] }],
                    transaction: t
                });
                roleWithPerms?.Permissions?.forEach(p => permissions.push(p.code));
            }

            // 7. Liên kết & Cập nhật Hồ sơ (Source of Truth)
            // Cập nhật Email/SĐT của hồ sơ theo thông tin User (nếu hồ sơ chưa có hoặc muốn đồng bộ)
            const memberUpdate = {
                userId: user.id,
                isActivated: true,
                activatedAt: new Date(),
                failedAttempts: 0,
                lockedUntil: null
            };
            if (!member.email) memberUpdate.email = email?.trim();
            if (!member.phoneNumber) memberUpdate.phoneNumber = phoneNumber?.trim();

            await member.update(memberUpdate, { transaction: t });

            // 8. Lưu Token & Log
            const accessToken = generateAccessToken(user.id, { permissions });
            const refreshToken = generateRefreshToken(user.id);
            const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
            await user.update({ refreshTokenHash, lastLogin: new Date() }, { transaction: t });

            await UnionMemberHistory.create({
                unionMemberId: member.id,
                type: 'status_change',
                newValue: 'active',
                note: 'Tài khoản đã được kích hoạt bởi người dùng'
            }, { transaction: t });

            await AuditLog.create({
                tableName: 'users',
                recordId: user.id.toString(),
                action: 'ACTIVATE_ACCOUNT',
                newValues: { memberId: member.id, memberCode: member.memberCode },
                ipAddress: userData.ip || 'unknown'
            }, { transaction: t });

            await t.commit();

            return {
                id: user.id,
                username: user.username,
                accessToken,
                refreshToken,
                message: 'Kích hoạt tài khoản và liên kết hồ sơ thành công!'
            };
        } catch (error) {
            if (t && !t.finished) await t.rollback();
            throw error;
        }
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
                        },
                        {
                            model: require('../models/profileUpdateRequest'),
                            as: 'ProfileUpdateRequests',
                            where: { status: 'pending' },
                            required: false,
                            limit: 1,
                            order: [['createdAt', 'DESC']]
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
