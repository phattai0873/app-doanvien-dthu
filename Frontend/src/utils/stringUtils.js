/**
 * Chuẩn hóa chuỗi tiếng Việt: chuyển sang chữ thường, loại bỏ dấu.
 * Phục vụ cho mục đích tìm kiếm thông minh.
 */
export const normalizeVietnamese = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD') // Tách các ký tự dấu ra khỏi chữ cái gốc
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các ký tự dấu
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim();
};
