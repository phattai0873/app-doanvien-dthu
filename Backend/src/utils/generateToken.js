const jwt = require('jsonwebtoken');

/**
 * Tạo Access Token (ngắn hạn, mặc định 15 phút)
 * Payload bao gồm id, permissions, isSuperAdmin và scope
 */
const generateAccessToken = (id, extra = {}) => {
    return jwt.sign(
        { 
            id, 
            permissions: extra.permissions || [],
            isSuperAdmin: extra.isSuperAdmin || false,
            scope: extra.scope || {}
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRE || '15m'
        }
    );
};

/**
 * Tạo Refresh Token (dài hạn, mặc định 7 ngày)
 */
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

module.exports = { generateAccessToken, generateRefreshToken };
