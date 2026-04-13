/**
 * Command Bus - Một Event Emitter đơn giản dựa trên CustomEvent
 * Dùng để liên lạc giữa Command Palette và các Page Component
 * mà không cần dùng Redux/Zustand.
 */

const COMMAND_EVENT = 'DTHU_COMMAND_ACTION';

export const commandBus = {
    /**
     * Phát lệnh thực hiện một hành động
     * @param {string} action - Tên hành động (vd: 'CREATE_MEMBER')
     * @param {object} payload - Dữ liệu đi kèm (nếu có)
     */
    emit(action, payload = {}) {
        const event = new CustomEvent(COMMAND_EVENT, { detail: { action, payload } });
        window.dispatchEvent(event);
    },

    /**
     * Lắng nghe lệnh thực hiện hành động
     * @param {Function} callback - Hàm xử lý lệnh
     * @returns {Function} - Hàm gỡ bỏ lắng nghe (cleanup)
     */
    on(callback) {
        const handler = (e) => callback(e.detail.action, e.detail.payload);
        window.addEventListener(COMMAND_EVENT, handler);
        return () => window.removeEventListener(COMMAND_EVENT, handler);
    }
};
