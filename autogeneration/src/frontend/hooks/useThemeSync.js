// src/frontend/hooks/useThemeSync.js
import { useState, useEffect } from 'react';

export const useThemeSync = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        const checkTheme = () => {
            const saved = localStorage.getItem('theme');
            setIsDark(saved === 'dark');
        };

        // Слушаем изменения темы
        window.addEventListener('themeChanged', checkTheme);
        
        // Также слушаем изменения в localStorage (на случай если тема меняется в другом окне)
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                checkTheme();
            }
        });

        return () => {
            window.removeEventListener('themeChanged', checkTheme);
            window.removeEventListener('storage', checkTheme);
        };
    }, []);

    return isDark;
};