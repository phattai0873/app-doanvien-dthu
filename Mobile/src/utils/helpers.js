/**
 * Format ngày tháng
 * @param {Date|string} date - Ngày cần format
 * @param {string} format - Định dạng: 'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'
 * @returns {string} - Ngày đã được format
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
        case 'DD-MM-YYYY':
            return `${day}-${month}-${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
};

/**
 * Validate email
 * @param {string} email - Email cần validate
 * @returns {boolean} - True nếu email hợp lệ
 */
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Validate số điện thoại Việt Nam
 * @param {string} phone - Số điện thoại cần validate
 * @returns {boolean} - True nếu số điện thoại hợp lệ
 */
export const validatePhone = (phone) => {
    const regex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return regex.test(phone);
};

/**
 * Truncate text
 * @param {string} text - Text cần cắt
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} - Text đã được cắt
 */
export const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Format số tiền
 * @param {number} amount - Số tiền
 * @param {string} currency - Đơn vị tiền tệ
 * @returns {string} - Số tiền đã được format
 */
export const formatCurrency = (amount, currency = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
/**
 * Decode HTML entities and strip tags
 * @param {string} html - HTML string to decode
 * @returns {string} - Clean text
 */
export const decodeHtml = (html) => {
    if (!html) return '';
    
    // 1. Thay thế các tag xuống dòng thành newline thực
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n');

    // 2. Loại bỏ toàn bộ tag HTML khác
    text = text.replace(/<[^>]*>?/gm, '');

    // 3. Decode các entities phổ biến
    const entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&copy;': '©',
        '&reg;': '®',
        '&#39;': "'",
        '&ndash;': '–',
        '&mdash;': '—'
    };
    return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match).trim();
};

/**
 * Format số lượt xem (Rút gọn)
 * @param {number} views - Lượt xem
 * @returns {string} - Lượt xem đã được format (k, tr)
 */
export const formatViews = (views) => {
    if (!views || views < 1000) return String(views || 0);
    if (views < 1000000) {
        const kValue = views / 1000;
        return (kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)).replace('.0', '') + 'k';
    }
    const trValue = views / 1000000;
    return (trValue % 1 === 0 ? trValue.toFixed(0) : trValue.toFixed(1)).replace('.0', '') + ' tr';
};
