// Конфигурация журнала событий системы
export const activityConfig = {
    // Типы событий
    eventTypes: {
        schedule: {
            name: 'Расписание',
            className: 'event-schedule'
        },
        extracurricular: {
            name: 'Внешкольные',
            className: 'event-extracurricular'
        },
        user: {
            name: 'Пользователь',
            className: 'event-user'
        },
        system: {
            name: 'Система',
            className: 'event-system'
        },
        edit: {
            name: 'Редактирование',
            className: 'event-edit'
        },
        generation: {
            name: 'Генерация',
            className: 'event-generation'
        }
    },

    // Журнал событий
    activityLog: [
        {
            id: 1,
            type: 'generation',
            time: '2026-10-25T14:30:00',
            text: 'Запущена автоматическая генерация расписаний для всех классов',
            user: 'admin'
        },
        {
            id: 2,
            type: 'edit',
            time: '2026-10-25T14:30:00',
            text: 'Расписание для 5"А" класса было отредактировано вручную',
            user: 'teacher1'
        },
        {
            id: 3,
            type: 'extracurricular',
            time: '2026-10-24T16:15:00',
            text: 'Добавлено внешкольное занятие "Шахматный клуб (Пн, Ср 15:00)"',
            user: 'admin'
        },
        {
            id: 4,
            type: 'user',
            time: '2026-10-24T10:00:00',
            text: 'В систему загружен новый список учителей',
            user: 'superadmin'
        },
        {
            id: 5,
            type: 'system',
            time: '2026-10-23T09:30:00',
            text: 'Обновлены данные по кабинетам для занятий',
            user: 'admin'
        }
    ],

    // Функция для форматирования времени
    formatTime: (dateString) => {
        const date = new Date(dateString);
        return `[${date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        })} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}]`;
    }
};