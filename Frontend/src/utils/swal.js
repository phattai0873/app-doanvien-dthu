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
        html: `Bạn có chắc muốn xóa <strong>"${name}"</strong>?<br/><span style="color:#ef4444;font-size:13px">Hành động này không thể hoàn tác!</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fa"></i> Xóa',
        cancelButtonText: 'Hủy',
        reverseButtons: true,
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
