const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.error(err.stack);

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Dữ liệu đã tồn tại';
        error = new ErrorResponse(message, 400);
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    // JWT invalid
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token không hợp lệ';
        error = new ErrorResponse(message, 401);
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
        const message = 'Token đã hết hạn';
        error = new ErrorResponse(message, 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi hệ thống',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;
