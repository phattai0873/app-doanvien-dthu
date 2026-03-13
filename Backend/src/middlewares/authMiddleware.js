const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['passwordHash'] },
                include: [
                    { model: Role },
                    { 
                        model: require('../models').UnionMember,
                        attributes: ['id', 'unionBranchId', 'unionCellId']
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
                return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
            }
            
            res.status(401).json({ success: false, message: 'Không có quyền truy cập, token lỗi' });
        }
    }

    else if (!token) {
        res.status(401).json({ success: false, message: 'Không có quyền truy cập, không có token' });
    }
};

// Handle roles (authorization)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.Roles) {
            return res.status(403).json({ success: false, message: 'Không có quyền thực hiện hành động này' });
        }

        const userRoles = req.user.Roles.map(role => role.code);
        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ success: false, message: 'Vai trò của bạn không được phép truy cập' });
        }
        next();
    };
};

module.exports = { protect, authorize };
