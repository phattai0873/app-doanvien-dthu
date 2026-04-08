const jwt = require('jsonwebtoken');
const { User, Role, UnionMember } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
            // Gán thông tin từ token vào request
            req.user = {
                id: decoded.id,
                permissions: decoded.permissions || [],
                isSuperAdmin: decoded.isSuperAdmin || false,
                scope: decoded.scope || {}
            };

            // Vẫn giữ load User record đầy đủ cho các trường hợp cần field khác (như username)
            // nhưng tối ưu hóa bằng cách không include Roles/Permissions ở đây vì đã có trong token
            const { User, UnionMember, UnionCell } = require('../models');
            const userFull = await User.findByPk(decoded.id, {
                attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
                include: [
                    { 
                        model: UnionMember,
                        attributes: ['id', 'fullName', 'avatar', 'unionCellId', 'status'],
                        include: [{ model: UnionCell, attributes: ['id', 'unionBranchId'] }]
                    }
                ]
            });

            if (!userFull) {
                return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
            }

            // Patch thêm các thông tin từ DB vào req.user mà token không chứa
            req.userRecord = userFull;
            req.user.username = userFull.username;
            
            // Gán hồ sơ đoàn viên
            let member = userFull.UnionMember;
            
            // Dự phòng: Nếu inclusion không lấy được (do lỗi Sequelize cache/association), thử findOne trực tiếp
            if (!member) {
                const { UnionMember, UnionCell } = require('../models');
                member = await UnionMember.findOne({
                    where: { userId: decoded.id },
                    attributes: ['id', 'fullName', 'avatar', 'unionCellId', 'status'],
                    include: [{ model: UnionCell, attributes: ['id', 'unionBranchId'] }]
                });
            }

            req.user.UnionMember = member;
            req.user.unionMemberId = member?.id;
            
            console.log(`[Auth-Debug] User: ${userFull.username}, ID: ${decoded.id}, MemberID: ${req.user.unionMemberId || 'NONE'}, Path: ${req.originalUrl}`);

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn' });
            }
            res.status(401).json({ success: false, message: 'Không có quyền truy cập, token lỗi' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Không có quyền truy cập, không có token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || req.user.isSuperAdmin) return next();

        // Tạm thời giữ lại check role cho tương thích ngược (nếu cần)
        // nhưng khuyến khích chuyển sang checkPermission
        console.warn('Deprecated: sử dụng authorize(roles) nên được thay thế bằng checkPermission(permission)');
        next();
    };
};

/**
 * Middleware kiểm tra quyền hạn (Permission-based)
 * Rất nhanh vì chỉ check mảng trong req.user
 */
const checkPermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
        }

        if (req.user.isSuperAdmin) return next();

        if (!req.user.permissions || !req.user.permissions.includes(permissionCode)) {
            return res.status(403).json({ 
                success: false, 
                message: `Bạn không có quyền thực hiện hành động này (${permissionCode})` 
            });
        }

        next();
    };
};

const loadUser = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const { User, Role, UnionMember, UnionCell } = require('../models');
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
                include: [
                    { model: Role, attributes: ['id', 'code', 'name'] },
                    { 
                        model: UnionMember, 
                        attributes: ['id', 'fullName', 'avatar', 'unionCellId', 'status'],
                        include: [{ model: UnionCell, attributes: ['id', 'unionBranchId'] }]
                    }
                ]
            });
        } catch (error) {
            // Không chặn request, chỉ log lỗi nhẹ nếu cần
            console.log('LoadUser Info:', error.message);
        }
    }
    next();
};

module.exports = { protect, authorize, checkPermission, loadUser };
