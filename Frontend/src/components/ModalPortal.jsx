import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal — render modal ra document.body để tránh stacking context
 * của AdminLayout (sidebar, sticky header, transform...) làm overlay không fill hết màn hình.
 *
 * Dùng:
     <ModalPortal onAttemptClose={handleAttemptClose}>
       <div>...nội dung modal...</div>
     </ModalPortal>
 */
export default function ModalPortal({ children, onAttemptClose, overlayClassName = "" }) {
    
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onAttemptClose?.();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onAttemptClose]);

    return createPortal(
        <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[1040] p-4 ${overlayClassName}`}
            onClick={e => e.target === e.currentTarget && onAttemptClose?.()}
        >
            {children}
        </div>,
        document.body
    );
}
