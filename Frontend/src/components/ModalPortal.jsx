import { createPortal } from 'react-dom';

/**
 * ModalPortal — render modal ra document.body để tránh stacking context
 * của AdminLayout (sidebar, sticky header, transform...) làm overlay không fill hết màn hình.
 *
 * Dùng:
 *   <ModalPortal onClose={onClose}>
 *     <div>...nội dung modal...</div>
 *   </ModalPortal>
 */
export default function ModalPortal({ children, onClose, overlayClassName = "" }) {
    return createPortal(
        <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 ${overlayClassName}`}
            onClick={e => e.target === e.currentTarget && onClose?.()}
        >
            {children}
        </div>,
        document.body
    );
}
