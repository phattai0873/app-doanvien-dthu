import Swal from 'sweetalert2';

// Màu sắc khớp với theme của app (primary color)
const PRIMARY = '#1d4ed8'; // blue-700

/**
 * Xác nhận xóa — hộp thoại màu đỏ
 * @param {string} name - Tên item sẽ bị xóa
 */
export const confirmDelete = (name) =>
    Swal.fire({
        title: 'Xác nhận xóa?',
        html: `Bạn có chắc muốn xóa <strong>"${name}"</strong>?<br/><span style="color:#f59e0b;font-size:13px">Mục này sẽ được chuyển vào thùng rác.</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Xóa vào thùng rác',
        cancelButtonText: 'Hủy',
        reverseButtons: true,
        focusCancel: true,
    });

/**
 * Xác nhận khôi phục — hộp thoại màu xanh lá
 * @param {string} name 
 */
export const confirmRestore = (name) =>
    Swal.fire({
        title: 'Khôi phục dữ liệu?',
        html: `Bạn muốn đưa <strong>"${name}"</strong> quay trở lại danh sách hoạt động?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Khôi phục ngay',
        cancelButtonText: 'Hủy',
        reverseButtons: true,
    });

/**
 * Xác nhận xóa vĩnh viễn — hộp thoại màu đỏ rực
 * @param {string} name 
 */
export const confirmForceDelete = (name) =>
    Swal.fire({
        title: 'XÓA VĨNH VIỄN?',
        html: `<strong>"${name}"</strong> và các dữ liệu liên quan (bao gồm tệp tin) sẽ bị xóa hoàn toàn.<br/><span style="color:#ef4444;font-weight:bold;font-size:14px uppercase">HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!</span>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'XÓA VĨNH VIỄN',
        cancelButtonText: 'Hủy',
        reverseButtons: true,
        focusConfirm: false,
        focusCancel: true,
    });

/**
 * Xác nhận hành động khác (đăng bài, khóa...) — hộp thoại màu xanh
 * @param {string} title - Tiêu đề
 * @param {string} text - Mô tả hành động
 * @param {string} confirmText - Nội dung nút xác nhận
 */
export const confirmAction = (title, text, confirmText = 'Xác nhận') =>
    Swal.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: PRIMARY,
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: 'Hủy',
        reverseButtons: true,
    });

/**
 * Thông báo thành công
 * @param {string} msg
 */
export const swalSuccess = (msg) =>
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: msg,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
    });

/**
 * Thông báo lỗi
 * @param {string} msg
 */
export const swalError = (msg) =>
    Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: msg,
        confirmButtonColor: PRIMARY,
    });

/**
 * Hộp thoại yêu cầu nhập lý do (ví dụ từ chối)
 * @param {string} title 
 * @param {string} placeholder
 */
export const confirmReason = (title, placeholder = 'Nhập lý do tại đây...') =>
    Swal.fire({
        title,
        input: 'textarea',
        inputPlaceholder: placeholder,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: PRIMARY,
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Gửi',
        cancelButtonText: 'Hủy',
        reverseButtons: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Bạn cần nhập nội dung!';
            }
        }
    });

export default Swal;
