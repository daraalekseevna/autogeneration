// src/frontend/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // Получаем данные пользователя из localStorage
    const getUser = () => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    };

    const user = getUser();
    
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // Проверяем, есть ли у пользователя необходимая роль
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Перенаправляем на страницу в зависимости от роли
        switch(user.role) {
            case 'superadmin':
                return <Navigate to="/superadmin" replace />;
            case 'admin':
                return <Navigate to="/" replace />;
            case 'teacher':
                return <Navigate to="/teacher" replace />;
            case 'class':
                return <Navigate to="/class" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }
    
    return children;
};

export default ProtectedRoute;