// Конфигурация пользователей системы
export const usersConfig = {
    // Список пользователей
    users: {
        superadmin: {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            role: 'superadmin',
            name: 'Супер Администратор',
            email: 'superadmin@school20.ru',
            avatarColor: '#ff4757'
        },
        admin: {
            id: 2,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Администратор',
            email: 'admin@school20.ru',
            avatarColor: '#2ed573'
        },
        teacher1: {
            id: 3,
            username: 'teacher1',
            password: 'teacher123',
            role: 'teacher',
            name: 'Иванова Мария Петровна',
            subject: 'Математика',
            email: 'ivanova@school20.ru',
            avatarColor: '#1e90ff'
        },
        teacher2: {
            id: 4,
            username: 'teacher2',
            password: 'teacher456',
            role: 'teacher',
            name: 'Петров Алексей Иванович',
            subject: 'Русский язык',
            email: 'petrov@school20.ru',
            avatarColor: '#ffa502'
        },
        class5a: {
            id: 5,
            username: 'class5a',
            password: 'class123',
            role: 'class',
            name: '5 "А" Класс',
            teacher: 'Иванова М.П.',
            studentsCount: 25,
            avatarColor: '#3742fa'
        },
        class6b: {
            id: 6,
            username: 'class6b',
            password: 'class456',
            role: 'class',
            name: '6 "Б" Класс',
            teacher: 'Петров А.И.',
            studentsCount: 28,
            avatarColor: '#7bed9f'
        }
    },

    // Конфигурация ролей
    roles: {
        superadmin: {
            name: 'Супер администратор',
            description: 'Полный доступ ко всем функциям системы',
            permissions: ['all'],
            dashboardRoute: '/superadmin',
            icon: '👑'
        },
        admin: {
            name: 'Администратор',
            description: 'Управление расписанием и пользователями',
            permissions: ['manage_schedule', 'manage_users', 'view_reports'],
            dashboardRoute: '/',
            icon: '⚙️'
        },
        teacher: {
            name: 'Учитель',
            description: 'Просмотр и управление своим расписанием',
            permissions: ['view_schedule', 'manage_own_classes', 'view_students'],
            dashboardRoute: '/teacher',
            icon: '👩‍🏫'
        },
        class: {
            name: 'Класс',
            description: 'Просмотр расписания класса',
            permissions: ['view_schedule', 'view_announcements'],
            dashboardRoute: '/class',
            icon: '👨‍🎓'
        }
    },

    // Маршруты для разных ролей
    roleRoutes: {
        superadmin: '/superadmin',
        admin: '/',
        teacher: '/teacher',
        class: '/class'
    },

    // Демо пользователи для быстрого входа (опционально)
    demoUsers: [
        { username: 'superadmin', password: 'super123', label: 'Супер админ' },
        { username: 'admin', password: 'admin123', label: 'Администратор' },
        { username: 'teacher1', password: 'teacher123', label: 'Учитель математики' },
        { username: 'class5a', password: 'class123', label: '5 "А" класс' }
    ],

    // Валидация пароля
    passwordValidation: {
        minLength: 6,
        requireNumbers: true,
        requireLetters: true
    },

    // Настройки сессии
    session: {
        timeout: 60, // минут
        rememberMeDuration: 30 // дней
    }
};

// Функция для получения пользователя по логину и паролю
export const findUserByCredentials = (username, password) => {
    return Object.values(usersConfig.users).find(user => 
        user.username === username && user.password === password
    );
};

// Функция для получения всех пользователей определенной роли
export const getUsersByRole = (role) => {
    return Object.values(usersConfig.users).filter(user => user.role === role);
};

// Функция для получения информации о роли
export const getRoleInfo = (role) => {
    return usersConfig.roles[role] || null;
};

// Функция для получения маршрута по роли
export const getRouteByRole = (role) => {
    return usersConfig.roleRoutes[role] || '/';
};