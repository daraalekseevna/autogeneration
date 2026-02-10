// Конфигурация текущего состояния системы
export const statusConfig = {
    // Типы статусов и их стили
    statusTypes: {
        ok: {
            name: 'Успешно',
            indicatorClass: 'status-ok',
            color: '#2ecc71'
        },
        info: {
            name: 'Информация',
            indicatorClass: 'status-info',
            color: '#3498db'
        },
        warning: {
            name: 'Предупреждение',
            indicatorClass: 'status-warning',
            color: '#f39c12'
        }
    },

    // Текущее состояние расписания
    currentStatus: [
        {
            id: 1,
            type: 'ok',
            label: 'Расписание на 2026/27 учебный год',
            value: 'Сгенерировано',
            details: 'Расписание утверждено директором',
            timestamp: '2026-10-25T14:30:00'
        },
        {
            id: 2,
            type: 'info',
            label: 'Внешкольные занятия',
            value: 'Добавлено 8 мероприятий',
            details: 'Кружки и секции на новый учебный год',
            timestamp: '2026-10-24T16:15:00'
        },
        {
            id: 3,
            type: 'ok',
            label: 'Последняя генерация',
            value: '25.10.2026, 14:30',
            details: 'Автоматическая генерация расписания',
            timestamp: '2026-10-25T14:30:00'
        },
        {
            id: 4,
            type: 'warning',
            label: 'Следующее обновление',
            value: '—',
            details: 'Запланируйте следующее обновление',
            timestamp: null
        }
    ],

    // Статистика
    statistics: {
        totalClasses: 28,
        teachersCount: 45,
        scheduledLessons: 156,
        extracurricularActivities: 8
    },

    // Функция для форматирования даты
    formatDate: (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};