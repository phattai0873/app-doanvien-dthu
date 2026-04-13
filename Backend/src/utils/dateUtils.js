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
const safeDate = (date, fallback = null, onlyDate = true) => {
    if (!date) return fallback;
    
    // Nếu là string "Invalid date" từ JS lỗi
    if (typeof date === 'string' && date.toLowerCase().includes('invalid')) return fallback;

    let d;
    if (date instanceof Date) {
        d = date;
    } else {
        const parsed = parseDate(date);
        d = new Date(parsed);
    }
    
    if (isNaN(d.getTime())) {
        return fallback;
    }
    
    if (onlyDate) {
        // Trả về YYYY-MM-DD theo giờ địa phương để tránh lệch ngày do ISO
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return d; // Trả về đối tượng Date cho các trường DATETIME
};

module.exports = { parseDate, safeDate };
