const { Op } = require('sequelize');

/**
 * Tạo options phân trang từ query params
 * @param {object} query - req.query
 * @returns {{ limit, offset, page }}
 */
const getPagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

/**
 * Định dạng kết quả phân trang
 */
const formatPaginatedResponse = (result, page, limit) => {
    const { count, rows } = result;
    const totalPages = Math.ceil(count / limit);
    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

/**
 * Tạo điều kiện tìm kiếm iLike từ danh sách fields và keyword
 * @param {string} search - từ khóa
 * @param {string[]} fields - các trường cần tìm
 */
const buildSearchCondition = (search, fields) => {
    if (!search || !fields.length) return {};
    return {
        [Op.or]: fields.map(field => ({
            [field]: { [Op.iLike]: `%${search}%` }
        }))
    };
};

module.exports = { getPagination, formatPaginatedResponse, buildSearchCondition };
