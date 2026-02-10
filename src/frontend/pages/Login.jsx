import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MainContent.css';
import '../styles/Login.css';

// Импорт конфигураций
import { findUserByCredentials, getRouteByRole } from '../config/usersConfig';
import { loginConfig, getPasswordFieldType, getPasswordToggleConfig } from '../config/loginConfig';
import { appConfig, getCopyrightInfo } from '../config/appConfig';

const Login = () => {
    const [formState, setFormState] = useState({
        username: '',
        password: '',
        showPassword: false,
        error: '',
        isLoading: false
    });

    const navigate = useNavigate();

    // Функция для обновления состояния формы
    const updateFormState = (updates) => {
        setFormState(prev => ({
            ...prev,
            ...updates
        }));
    };

    // Функция обработки входа
    const handleLogin = async (e) => {
        e.preventDefault();
        updateFormState({ error: '' });
        
        // Проверка заполненности полей
        if (!formState.username.trim() || !formState.password.trim()) {
            updateFormState({ error: loginConfig.errorMessages.emptyFields });
            return;
        }

        updateFormState({ isLoading: true });

        // Имитация задержки сети
        await new Promise(resolve => 
            setTimeout(resolve, loginConfig.network.simulateDelay)
        );

        // Поиск пользователя
        const user = findUserByCredentials(formState.username, formState.password);

        if (user) {
            // Сохраняем данные пользователя
            const userData = {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                email: user.email,
                avatarColor: user.avatarColor,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('user', JSON.stringify(userData));

            // Перенаправляем по роли
            const route = getRouteByRole(user.role);
            navigate(route);
        } else {
            updateFormState({ error: loginConfig.errorMessages.invalidCredentials });
        }
        
        updateFormState({ isLoading: false });
    };

    // Функция для обработки изменения полей ввода
    const handleInputChange = (field, value) => {
        updateFormState({ 
            [field]: value,
            error: '' 
        });
    };

    // Получаем текущую конфигурацию переключателя пароля
    const passwordToggleConfig = getPasswordToggleConfig(formState.showPassword);

    return (
        <div className="login-page">
            {/* Анимированный фон */}
            <div className="animated-bg login-background">
                {[...Array(appConfig.decorations.backgroundCircles)].map((_, i) => (
                    <div key={i} className="glass-circle"></div>
                ))}
            </div>
            
            {/* Декоративные элементы */}
            <div className="login-decoration decoration-1"></div>
            <div className="login-decoration decoration-2"></div>

            <div className="login-container">
                {/* Шапка с логотипом */}
                <div className="login-header">
                    <p className="login-subtitle">{appConfig.system.name}</p>
                </div>

                {/* Карточка с формой входа */}
                <div className="login-card">
                    <h2 className="login-card-title">Вход в систему</h2>

                    <form className="login-form" onSubmit={handleLogin}>
                        {/* Поле имени пользователя */}
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

                        {/* Поле пароля */}
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

                        {/* Сообщение об ошибке */}
                        {formState.error && (
                            <div className="error-message">
                                <div className="error-marker"></div>
                                {formState.error}
                            </div>
                        )}

                        {/* Кнопка входа */}
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

                {/* Информация о системе */}
                <div className="system-info">
                    <p>{getCopyrightInfo()}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;