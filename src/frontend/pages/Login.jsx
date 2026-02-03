// src/frontend/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaSchool } from 'react-icons/fa';
import '../styles/MainContent.css';
import '../styles/Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Пользователи для демонстрации
    const users = [
        { username: 'superadmin', password: 'super123', role: 'superadmin', name: 'Супер Администратор' },
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Администратор' },
        { username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'Учитель Иванова' },
        { username: 'class5a', password: 'class123', role: 'class', name: '5 "А" Класс' },
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!username.trim() || !password.trim()) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        setIsLoading(true);

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 800));

        // Находим пользователя
        const user = users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            // Сохраняем данные пользователя
            localStorage.setItem('user', JSON.stringify({
                username: user.username,
                role: user.role,
                name: user.name
            }));

            // Перенаправляем в зависимости от роли
            switch(user.role) {
                case 'superadmin':
                    navigate('/superadmin');
                    break;
                case 'admin':
                    navigate('/');
                    break;
                case 'teacher':
                    navigate('/teacher');
                    break;
                case 'class':
                    navigate('/class');
                    break;
                default:
                    navigate('/');
            }
        } else {
            setError('Неверное имя пользователя или пароль');
        }
        
        setIsLoading(false);
    };

    return (
        <div className="login-page">
            {/* Анимированный фон из MainContent.css */}
            <div className="animated-bg login-background">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            {/* Декоративные элементы */}
            <div className="login-decoration decoration-1"></div>
            <div className="login-decoration decoration-2"></div>

            <div className="login-container">
                {/* Шапка с логотипом */}
                <div className="login-header">

                    <p className="login-subtitle">Система управления расписанием</p>
                </div>

                {/* Карточка с формой входа */}
                <div className="login-card">
                    <h2 className="login-card-title">Вход в систему</h2>

                    <form className="login-form" onSubmit={handleLogin}>
                        {/* Поле имени пользователя */}
                        <div className="form-group">
                            <label className="form-label">Имя пользователя</label>
                            <div className="input-with-icon">
                                <FaUser className="input-icon" />
                                <input
                                    type="text"
                                    className="login-input"
                                    placeholder="Введите логин"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Поле пароля */}
                        <div className="form-group password-group">
                            <div className="password-header">
                                <label className="form-label">Пароль</label>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <>
                                            <FaEyeSlash /> Скрыть
                                        </>
                                    ) : (
                                        <>
                                            <FaEye /> Показать
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="input-with-icon">
                                <FaLock className="input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="login-input"
                                    placeholder="Введите пароль"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Сообщение об ошибке */}
                        {error && (
                            <div className="error-message">
                                <div className="error-marker"></div>
                                {error}
                            </div>
                        )}

                        {/* Кнопка входа */}
                        <button
                            type="submit"
                            className={`login-button ${isLoading ? 'login-loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="login-button-spinner"></span>
                                    Вход...
                                </>
                            ) : (
                                <>
                                    <FaSignInAlt style={{ marginRight: '0.5rem' }} />
                                    Войти в систему
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Информация о системе (опционально) */}
                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center',
                    color: 'var(--gray-dark)',
                    fontSize: '0.9rem',
                    fontFamily: "'MS Reference Sans Serif', 'Segoe UI', sans-serif",
                    opacity: '0.7'
                }}>
                    <p>© 2026  МАОУ МО Динской район СОШ № 20 имени Жукова В.А. Все права защищены.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;