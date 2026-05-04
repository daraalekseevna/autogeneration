// Конфигурация пользователей системы - ИНТЕГРАЦИЯ С БЭКЕНДОМ
const API_URL = 'http://localhost:5000/api';

// Резервные демо-данные (на случай, если бэкенд не доступен)
const DEMO_USERS = {
    superadmin: {
        id: 1,
        username: 'superadmin',
        password: 'superadmin123',
        role: 'superadmin',
        name: 'Супер Администратор',
        email: 'superadmin@school20.ru',
        avatarColor: '#ff4757'
    }
};

// Конфигурация ролей (статическая, не меняется)
export const rolesConfig = {
    superadmin: {
        name: 'Супер администратор',
        description: 'Полный доступ ко всем функциям системы',
        permissions: ['all'],
        dashboardRoute: '/superadmin',
        icon: ''
    },
    admin: {
        name: 'Администратор',
        description: 'Управление расписанием и пользователями',
        permissions: ['manage_schedule', 'manage_users', 'view_reports'],
        dashboardRoute: '/',
        icon: ''
    },
    teacher: {
        name: 'Учитель',
        description: 'Просмотр и управление своим расписанием',
        permissions: ['view_schedule', 'manage_own_classes', 'view_students'],
        dashboardRoute: '/teacher',
        icon: ''
    },
    class: {
        name: 'Класс',
        description: 'Просмотр расписания класса',
        permissions: ['view_schedule', 'view_announcements'],
        dashboardRoute: '/class',  // <-- ИСПРАВЛЕНО: было '/class/schedule', стало '/class'
        icon: ''
    },
    student: {
        name: 'Ученик',
        description: 'Просмотр расписания и оценок',
        permissions: ['view_schedule', 'view_grades'],
        dashboardRoute: '/student',
        icon: ''
    }
};

// Маршруты для разных ролей
export const roleRoutes = {
    superadmin: '/superadmin',
    admin: '/',
    teacher: '/teacher',
    class: '/class',  // <-- ИСПРАВЛЕНО: было '/class/schedule', стало '/class'
    student: '/student'
};

// Функция для получения маршрута по роли (с отладкой)
export const getRouteByRole = (role) => {
    console.log('getRouteByRole called with role:', role);
    console.log('Available routes:', roleRoutes);
    
    const route = roleRoutes[role];
    if (!route) {
        console.error(`Unknown role: ${role}, available roles:`, Object.keys(roleRoutes));
        return '/';
    }
    console.log(`Route for role ${role}: ${route}`);
    return route;
};

// Остальные функции...
export const authenticateUser = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            let userInfo = {
                id: data.user.id,
                username: data.user.login,
                role: data.user.role,
                name: data.user.name || data.user.login,
                email: data.user.email || `${data.user.login}@school20.ru`,
                avatarColor: getAvatarColor(data.user.role),
                gradeNumber: data.user.gradeNumber,
                gradeLetter: data.user.gradeLetter,
                lastName: data.user.lastName,
                firstName: data.user.firstName,
                middleName: data.user.middleName
            };

            return {
                success: true,
                user: userInfo,
                token: data.token
            };
        } else {
            const error = await response.json();
            return {
                success: false,
                error: error.message || 'Неверный логин или пароль'
            };
        }
    } catch (error) {
        console.error('API connection error:', error);
        return authenticateWithDemo(username, password);
    }
};

const authenticateWithDemo = (username, password) => {
    const user = Object.values(DEMO_USERS).find(
        user => user.username === username && user.password === password
    );

    if (user) {
        return {
            success: true,
            user: {
                ...user,
                loginTime: new Date().toISOString()
            },
            token: `demo_token_${user.id}_${Date.now()}`
        };
    }

    return {
        success: false,
        error: 'Неверный логин или пароль'
    };
};

const getAvatarColor = (role) => {
    const colors = {
        superadmin: '#ff4757',
        admin: '#2ed573',
        teacher: '#1e90ff',
        class: '#ffa502',
        student: '#3742fa'
    };
    return colors[role] || '#7bed9f';
};

export const getUsersByRole = (role) => {
    console.warn('getUsersByRole should be replaced with API call');
    return [];
};

export const getRoleInfo = (role) => {
    return rolesConfig[role] || null;
};

export const usersConfig = {
    roles: rolesConfig,
    roleRoutes: roleRoutes,
    passwordValidation: {
        minLength: 6,
        requireNumbers: true,
        requireLetters: true
    },
    session: {
        timeout: 60,
        rememberMeDuration: 30
    }
};