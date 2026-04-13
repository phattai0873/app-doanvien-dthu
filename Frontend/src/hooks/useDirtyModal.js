import { useState, useEffect, useRef } from 'react';
import { confirmUnsavedChanges } from '../utils/swal';

/**
 * Hook hỗ trợ quản lý trạng thái dirty và xác nhận thoát Modal
 * @param {Object} formData - Dữ liệu form hiện tại
 * @param {Function} onClose - Hàm đóng modal thực sự
 * @returns {Object} { isDirty, handleAttemptClose }
 */
export const useDirtyModal = (formData, onClose) => {
    // Lưu trữ dữ liệu gốc khi modal được mở (hoặc khi component mount)
    const [initialForm] = useState(formData);
    
    // Kiểm tra xem dữ liệu đã thay đổi hay chưa
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm);

    const handleAttemptClose = async () => {
        if (isDirty) {
            const result = await confirmUnsavedChanges();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    // Chặn phím ESC và Click Overlay (nếu ModalPortal sử dụng handleAttemptClose)
    // Thực tế ModalPortal đã gọi onAttemptClose nên ta sẽ truyền handleAttemptClose vào đó.

    // Bonus: Chặn refresh/đóng tab trình duyệt
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return { isDirty, handleAttemptClose };
};
