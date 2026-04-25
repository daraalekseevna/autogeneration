import React, { useState } from 'react';
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
        error: '',
        isLoading: false
    });

    const navigate = useNavigate();

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

            // Сохраняем токен
            localStorage.setItem('token', token);
            
            // Сохраняем данные пользователя
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                username: user.login,
                role: user.role,
                loginTime: new Date().toISOString()
            }));

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
                                    autoComplete={loginConfig.formFields.username.autoComplete}
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
                                    autoComplete={loginConfig.formFields.password.autoComplete}
                                />
                            </div>
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