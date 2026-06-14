import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MainContent.css';
import '../styles/Login.css';

// Импорт конфигураций
import { getRouteByRole, authenticateUser } from '../config/usersConfig';
import { loginConfig, getPasswordFieldType, getPasswordToggleConfig } from '../config/loginConfig';
import { appConfig, getCopyrightInfo } from '../config/appConfig';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
    const [formState, setFormState] = useState({
        username: '',
        password: '',
        showPassword: false,
        rememberMe: false,
        error: '',
        isLoading: false
    });

    const navigate = useNavigate();

    // При загрузке страницы проверяем сохраненные данные
    useEffect(() => {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        if (rememberMe && savedUsername && savedPassword) {
            setFormState(prev => ({
                ...prev,
                username: savedUsername,
                password: savedPassword,
                rememberMe: true
            }));
        }
    }, []);

    const updateFormState = (updates) => {
        setFormState(prev => ({ ...prev, ...updates }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        updateFormState({ error: '' });
        
        if (!formState.username.trim() || !formState.password.trim()) {
            updateFormState({ error: 'Введите логин и пароль' });
            return;
        }

        updateFormState({ isLoading: true });

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                login: formState.username,
                password: formState.password
            });

            const { token, user } = response.data;

            console.log('User data from backend:', user);

            // Сохраняем токен
            localStorage.setItem('token', token);
            
            // Сохраняем ВСЕ данные пользователя целиком
            localStorage.setItem('user', JSON.stringify(user));

            // Если "Запомнить меня" включено - сохраняем логин и пароль
            if (formState.rememberMe) {
                localStorage.setItem('savedUsername', formState.username);
                localStorage.setItem('savedPassword', formState.password);
                localStorage.setItem('rememberMe', 'true');
            } else {
                // Если не включено - удаляем сохраненные данные
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
                localStorage.removeItem('rememberMe');
            }

            // Устанавливаем токен для axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Перенаправляем по роли
            const route = getRouteByRole(user.role);
            navigate(route);
            
        } catch (err) {
            console.error('Login error:', err);
            
            if (err.response) {
                if (err.response.status === 401) {
                    updateFormState({ error: 'Неверный логин или пароль' });
                } else if (err.response.status === 500) {
                    updateFormState({ error: 'Ошибка сервера. Попробуйте позже.' });
                } else {
                    updateFormState({ error: err.response.data?.message || 'Ошибка входа' });
                }
            } else if (err.request) {
                updateFormState({ error: 'Не удается подключиться к серверу. Убедитесь, что бэкенд запущен.' });
            } else {
                updateFormState({ error: 'Произошла ошибка. Попробуйте снова.' });
            }
        } finally {
            updateFormState({ isLoading: false });
        }
    };

    const handleInputChange = (field, value) => {
        updateFormState({ 
            [field]: value,
            error: '' 
        });
    };

    const passwordToggleConfig = getPasswordToggleConfig(formState.showPassword);

    return (
        <div className="login-page">
            <div className="animated-bg login-background">
                {[...Array(appConfig.decorations?.backgroundCircles || 10)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            <div className="login-decoration decoration-1"></div>
            <div className="login-decoration decoration-2"></div>

            <div className="login-container">
                <div className="login-header">
                    <p className="login-subtitle">{appConfig.system?.name || 'Школьная система'}</p>
                </div>

                <div className="login-card">
                    <h2 className="login-card-title">Вход в систему</h2>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">
                                {loginConfig.formFields.username.label}
                            </label>
                            <div className="input-with-icon">
                                <loginConfig.formFields.username.icon className="input-icon" />
                                <input
                                    type={loginConfig.formFields.username.type}
                                    className="login-input"
                                    placeholder={loginConfig.formFields.username.placeholder}
                                    value={formState.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    disabled={formState.isLoading}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="form-group password-group">
                            <div className="password-header">
                                <label className="form-label">
                                    {loginConfig.formFields.password.label}
                                </label>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => updateFormState({ 
                                        showPassword: !formState.showPassword 
                                    })}
                                    disabled={formState.isLoading}
                                    title={passwordToggleConfig.title}
                                >
                                    <passwordToggleConfig.icon /> {passwordToggleConfig.text}
                                </button>
                            </div>
                            <div className="input-with-icon">
                                <loginConfig.formFields.password.icon className="input-icon" />
                                <input
                                    type={getPasswordFieldType(formState.showPassword)}
                                    className="login-input"
                                    placeholder={loginConfig.formFields.password.placeholder}
                                    value={formState.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    disabled={formState.isLoading}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Чекбокс "Запомнить меня" */}
                        <div className="form-group remember-me-group">
                            <label className="remember-me-label">
                                <input
                                    type="checkbox"
                                    className="remember-me-checkbox"
                                    checked={formState.rememberMe}
                                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                                    disabled={formState.isLoading}
                                />
                                <span className="remember-me-text">Запомнить меня</span>
                            </label>
                        </div>

                        {formState.error && (
                            <div className="error-message">
                                <div className="error-marker"></div>
                                {formState.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={formState.isLoading ? 
                                loginConfig.button.loading.className : 
                                loginConfig.button.normal.className
                            }
                            disabled={formState.isLoading}
                        >
                            {formState.isLoading ? (
                                <>
                                    <span className="login-button-spinner"></span>
                                    {loginConfig.button.loading.text}
                                </>
                            ) : (
                                <>
                                    <loginConfig.button.normal.icon style={{ marginRight: '0.5rem' }} />
                                    {loginConfig.button.normal.text}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="system-info">
                    <p>{getCopyrightInfo()}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;