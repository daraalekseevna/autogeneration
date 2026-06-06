// frontend/src/hooks/useToast.js
import { useState, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification';

export const useToast = () => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        setToast({ message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const ToastContainer = useCallback(() => (
        toast && (
            <ToastNotification
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={hideToast}
            />
        )
    ), [toast, hideToast]);

    return { showToast, ToastContainer };
};

export default useToast;