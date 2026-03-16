const jwt = require('jsonwebtoken');
const { User, Role, UnionMember } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const { User, Role, UnionMember, UnionCell } = require('../models');
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['passwordHash', 'refreshTokenHash'] },
                include: [
                    { 
                        model: Role,
                        attributes: ['id', 'code', 'name']
                    },
                    { 
                        model: UnionMember,
                        attributes: ['id', 'fullName', 'avatar', 'unionCellId', 'status'],
                        include: [
                            {
                                model: UnionCell,
                                attributes: ['id', 'unionBranchId']
                            }
                        ]
                    }
                ]
            });

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
            }

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
        if (!req.user || !req.user.Roles) {
            return res.status(403).json({ success: false, message: 'Không có quyền thực hiện hành động này' });
        }

        const userRoles = req.user.Roles.map(role => role.code);
        
        if (userRoles.includes('SUPER_ADMIN')) return next();

        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ success: false, message: 'Vai trò của bạn không được phép truy cập' });
        }
        next();
    };
};

module.exports = { protect, authorize };
