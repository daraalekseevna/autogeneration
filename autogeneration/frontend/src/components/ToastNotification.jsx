// frontend/src/components/ToastNotification.jsx
import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastNotification = ({ message, type = 'success', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const icons = {
        success: <FaCheckCircle size={18} />,
        error: <FaExclamationCircle size={18} />,
        info: <FaInfoCircle size={18} />
    };

    const colors = {
        success: { bg: '#10b981', text: 'white' },
        error: { bg: '#ef4444', text: 'white' },
        info: { bg: '#3b82f6', text: 'white' }
    };

    return (
        <div className="toast-notification" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            animation: 'slideInRight 0.3s ease'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: colors[type].bg,
                color: colors[type].text,
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '280px',
                maxWidth: '400px'
            }}>
                {icons[type]}
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{message}</span>
                <button 
                    onClick={() => { setIsVisible(false); if (onClose) setTimeout(onClose, 300); }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                    <FaTimes size={14} />
                </button>
            </div>
        </div>
    );
};

// Добавляем стили в head (выполнится один раз)
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        .toast-notification {
            animation: slideInRight 0.3s ease;
        }
        .toast-notification.exit {
            animation: slideOutRight 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

export default ToastNotification;