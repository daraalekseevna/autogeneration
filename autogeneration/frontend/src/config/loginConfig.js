import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

// Конфигурация формы логина
export const loginConfig = {
    // Настройки полей формы
    formFields: {
        username: {
            id: 'username',
            label: 'Имя пользователя',
            icon: FaUser,
            placeholder: 'Введите логин',
            type: 'text',
            autoComplete: 'username',
            required: true
        },
        password: {
            id: 'password',
            label: 'Пароль',
            icon: FaLock,
            placeholder: 'Введите пароль',
            type: 'password', // будет изменяться динамически
            autoComplete: 'current-password',
            required: true
        }
    },

    // Настройки кнопки входа
    button: {
        normal: {
            text: 'Войти в систему',
            icon: FaSignInAlt,
            className: 'login-button'
        },
        loading: {
            text: 'Вход...',
            showSpinner: true,
            className: 'login-button login-loading'
        }
    },

    // Настройки переключателя видимости пароля
    passwordToggle: {
        show: {
            icon: FaEyeSlash,
            text: 'Скрыть',
            title: 'Скрыть пароль'
        },
        hide: {
            icon: FaEye,
            text: 'Показать',
            title: 'Показать пароль'
        }
    },

    // Сообщения об ошибках
    errorMessages: {
        emptyFields: 'Пожалуйста, заполните все поля',
        invalidCredentials: 'Неверное имя пользователя или пароль',
        networkError: 'Ошибка соединения. Проверьте интернет',
        serverError: 'Ошибка сервера. Попробуйте позже'
    },

    // Настройки валидации
    validation: {
        username: {
            minLength: 3,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            patternMessage: 'Только латинские буквы, цифры и подчеркивание'
        },
        password: {
            minLength: 6,
            maxLength: 30
        }
    },

    // Настройки задержки (имитация сетевого запроса)
    network: {
        simulateDelay: 800, // миллисекунд
        minDelay: 300,
        maxDelay: 1500
    }
};

// Функция для получения типа поля пароля
export const getPasswordFieldType = (showPassword) => {
    return showPassword ? 'text' : 'password';
};

// Функция для получения конфигурации переключателя пароля
export const getPasswordToggleConfig = (showPassword) => {
    return showPassword ? loginConfig.passwordToggle.show : loginConfig.passwordToggle.hide;
};