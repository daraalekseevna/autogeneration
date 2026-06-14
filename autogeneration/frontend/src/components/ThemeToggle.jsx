// src/frontend/components/ThemeToggle.jsx
import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        if (isDark) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <button className="global-theme-toggle" onClick={toggleTheme} title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
            {isDark ? <FaSun /> : <FaMoon />}
            <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
    );
};

export default ThemeToggle;