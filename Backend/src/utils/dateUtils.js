/**
 * Chuyển đổi chuỗi ngày tháng từ định dạng DD/MM/YYYY sang YYYY-MM-DD
 * Hỗ trợ cả có thời gian DD/MM/YYYY HH:mm
 * @param {string} dateStr 
 * @returns {string} 
 */
const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    
    // Tách phần ngày và thời gian (nếu có)
    const [datePart, timePart] = dateStr.split(' ');
    
    // Kiểm tra định dạng bằng separator / hoặc -
    const separator = datePart.includes('/') ? '/' : (datePart.includes('-') && datePart.indexOf('-') < 4 ? '-' : null);
    
    if (separator) {
        const parts = datePart.split(separator);
        if (parts.length === 3) {
            // Giả định là Day/Month/Year
            const d = parts[0];
            const m = parts[1];
            const y = parts[2];
            
            // Re-format sang YYYY-MM-DD
            if (y.length === 4 && d.length <= 2) {
                const formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                return timePart ? `${formattedDate} ${timePart}` : formattedDate;
            }
        }
    }
    
    return dateStr;
};

/**
 * Đảm bảo trả về một chuỗi ngày hợp lệ hoặc null/fallback
 * @param {any} date 
 * @param {string|null} fallback 
 * @returns {string|null}
 */
const safeDate = (date, fallback = null) => {
    if (!date) return fallback;
    
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? fallback : date;
    }

    const parsed = parseDate(date);
    const d = new Date(parsed);
    
    if (isNaN(d.getTime())) {
        return fallback;
    }
    
    return parsed;
};

module.exports = { parseDate, safeDate };
