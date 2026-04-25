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
        icon: '👑'
    },
    admin: {
        name: 'Администратор',
        description: 'Управление расписанием и пользователями',
        permissions: ['manage_schedule', 'manage_users', 'view_reports'],
        dashboardRoute: '/admin',
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
    },
    student: {
        name: 'Ученик',
        description: 'Просмотр расписания и оценок',
        permissions: ['view_schedule', 'view_grades'],
        dashboardRoute: '/student',
        icon: '📚'
    }
};

// Маршруты для разных ролей
export const roleRoutes = {
    superadmin: '/superadmin',
    admin: '/admin',
    teacher: '/teacher',
    class: '/class',
    student: '/student'
};

// Функция для аутентификации через бэкенд
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
            
            // Получаем дополнительную информацию о пользователе
            let userInfo = {
                id: data.user.id,
                username: data.user.login,
                role: data.user.role,
                name: data.user.login,
                email: `${data.user.login}@school20.ru`,
                avatarColor: getAvatarColor(data.user.role)
            };

            // Если это учитель, получаем его ФИО
            if (data.user.role === 'teacher') {
                try {
                    const teacherInfo = await fetch(`${API_URL}/superadmin/teachers`, {
                        headers: {
                            'Authorization': `Bearer ${data.token}`
                        }
                    });
                    const teachers = await teacherInfo.json();
                    const teacher = teachers.find(t => t.login === data.user.login);
                    if (teacher) {
                        userInfo.name = teacher.name;
                        userInfo.email = teacher.email || userInfo.email;
                    }
                } catch (e) {
                    console.warn('Could not fetch teacher info:', e);
                }
            }

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
        // Если бэкенд не доступен, используем демо-режим
        return authenticateWithDemo(username, password);
    }
};

// Демо-аутентификация (резервный вариант)
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

// Функция для получения цвета аватара по роли
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

// Функция для получения пользователя по логину и паролю (устарело)
export const findUserByCredentials = (username, password) => {
    console.warn('findUserByCredentials is deprecated. Use authenticateUser instead.');
    return null;
};

// Функция для получения всех пользователей определенной роли
export const getUsersByRole = (role) => {
    // В реальном приложении это должно быть API, а не локальные данные
    console.warn('getUsersByRole should be replaced with API call');
    return [];
};

// Функция для получения информации о роли
export const getRoleInfo = (role) => {
    return rolesConfig[role] || null;
};

// Функция для получения маршрута по роли
export const getRouteByRole = (role) => {
    return roleRoutes[role] || '/';
};

// Для обратной совместимости
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