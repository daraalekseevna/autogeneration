// Конфигурация приложения
export const appConfig = {
    // Информация о школе
    school: {
        name: 'МАОУ МО Динской район СОШ № 20',
        fullName: 'МАОУ МО Динской район СОШ № 20 имени Жукова В.А.',
        address: 'Динской район, Краснодарский край',
        phone: '+7 (861) 123-45-67',
        email: 'school20@dinreg.ru',
        website: 'https://school20.dinreg.ru'
    },

    // Настройки системы
    system: {
        name: 'Система управления расписанием',
        version: '1.0.0',
        year: 2026,
        developer: 'Школьный ИТ отдел'
    },

    // Стили и темы
    theme: {
        colors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            light: '#f8f9fa',
            dark: '#343a40'
        },
        fonts: {
            main: "'MS Reference Sans Serif', 'Segoe UI', sans-serif",
            secondary: "'Arial', 'Helvetica', sans-serif"
        }
    },

    // Настройки декораций
    decorations: {
        backgroundCircles: 10,
        animationSpeed: '20s'
    },

    // Настройки безопасности
    security: {
        maxLoginAttempts: 5,
        lockoutTime: 15 // минут
    }
};

// Функция для получения информации о копирайте
export const getCopyrightInfo = () => {
    return `© ${appConfig.system.year} ${appConfig.school.fullName}. Все права защищены.`;
};

// Функция для получения полной информации о системе
export const getSystemInfo = () => {
    return {
        school: appConfig.school.name,
        system: appConfig.system.name,
        version: appConfig.system.version
    };
};