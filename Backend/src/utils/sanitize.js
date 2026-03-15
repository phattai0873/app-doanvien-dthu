/**
 * Chuyển các chuỗi rỗng thành null để tránh lỗi UUID trong PostgreSQL
 */
const sanitizeUUID = (data) => {
    if (!data || typeof data !== 'object') return data;
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '') {
            sanitized[key] = null;
        }
    });
    return sanitized;
};

module.exports = { sanitizeUUID };
