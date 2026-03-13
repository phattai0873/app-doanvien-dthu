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
