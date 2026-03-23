// src/frontend/config/extracurricularData.js

// ========== КОНСТАНТЫ ДЛЯ ВНЕШКОЛЬНЫХ ЗАНЯТИЙ ==========

// Цвета для занятий
export const COLORS = [
    { id: 1, name: "Зеленый", code: "#4CAF50" },
    { id: 2, name: "Синий", code: "#2196F3" },
    { id: 3, name: "Фиолетовый", code: "#9C27B0" },
    { id: 4, name: "Оранжевый", code: "#FF9800" },
    { id: 5, name: "Красный", code: "#F44336" },
    { id: 6, name: "Коричневый", code: "#795548" },
    { id: 7, name: "Серый", code: "#607D8B" },
    { id: 8, name: "Салатовый", code: "#8BC34A" },
    { id: 9, name: "Бирюзовый", code: "#009688" },
    { id: 10, name: "Оранжево-красный", code: "#FF5722" },
    { id: 11, name: "Темно-синий", code: "#3F51B5" },
    { id: 12, name: "Розовый", code: "#E91E63" },
    { id: 13, name: "Желтый", code: "#FFC107" },
    { id: 14, name: "Голубой", code: "#00BCD4" },
    { id: 15, name: "Оранжевый", code: "#FF9800" },
    { id: 16, name: "Светло-серый", code: "#9E9E9E" }
];

// Дни недели
export const WEEK_DAYS = [
    { id: 1, name: "Понедельник", short: "ПН", full: "Понедельник", order: 1 },
    { id: 2, name: "Вторник", short: "ВТ", full: "Вторник", order: 2 },
    { id: 3, name: "Среда", short: "СР", full: "Среда", order: 3 },
    { id: 4, name: "Четверг", short: "ЧТ", full: "Четверг", order: 4 },
    { id: 5, name: "Пятница", short: "ПТ", full: "Пятница", order: 5 },
    { id: 6, name: "Суббота", short: "СБ", full: "Суббота", order: 6 }
];

// Временные слоты (с 8:00 до 20:00 с интервалом 30 минут)
export const TIME_SLOTS = [];
for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
        const timeValue = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        TIME_SLOTS.push({
            id: timeValue,
            value: timeValue,
            label: timeValue
        });
    }
}

// Список преподавателей
export const TEACHERS = [
    { id: 1, name: "Кардальский Дмитрий Дмитриевич", fullName: "Кардальский Дмитрий Дмитриевич", subject: "Шахматы", experience: 15 },
    { id: 2, name: "Воронин М.В", fullName: "Воронин М.В", subject: "Стрельба/Радиоконструирование", experience: 12 },
    { id: 3, name: "Коваленко А.В", fullName: "Коваленко А.В", subject: "Самбо", experience: 20 },
    { id: 4, name: "Тыщенко О.Н", fullName: "Тыщенко О.Н", subject: "Театр", experience: 8 },
    { id: 5, name: "Шорина Г.Б", fullName: "Шорина Г.Б", subject: "Медиа", experience: 10 },
    { id: 6, name: "Плакса С.А", fullName: "Плакса С.А", subject: "Гандбол", experience: 14 },
    { id: 7, name: "Зажлолжный Н.А", fullName: "Зажлолжный Н.А", subject: "Программирование", experience: 18 }
];

// Кабинеты и места проведения
export const ROOMS = [
    { id: 1, name: "Каб. 203", type: "classroom", capacity: 20 },
    { id: 2, name: "Каб. 105", type: "classroom", capacity: 15 },
    { id: 3, name: "Каб. 204", type: "classroom", capacity: 10 },
    { id: 4, name: "Каб. 308", type: "classroom", capacity: 12 },
    { id: 5, name: "Каб. 310", type: "classroom", capacity: 15 },
    { id: 6, name: "Спортзал", type: "gym", capacity: 30 },
    { id: 7, name: "Спорткомплекс", type: "sports", capacity: 50 },
    { id: 8, name: "Футбольное поле", type: "outdoor", capacity: 30 },
    { id: 9, name: "Актовый зал", type: "hall", capacity: 100 },
    { id: 10, name: "Музыкальный класс", type: "music", capacity: 15 },
    { id: 11, name: "Танцевальный зал", type: "dance", capacity: 25 }
];

// ========== ДЕМО-ДАННЫЕ ==========
export const DEMO_ACTIVITIES = [
    {
        id: 1,
        title: "Шахматный клуб",
        teacher: "Кардальский Дмитрий Дмитриевич",
        teacherId: 1,
        days: ["Суббота"],
        startTime: "14:00",
        endTime: "15:00",
        color: "#4CAF50",
        room: "Каб. 203",
        roomId: 1,
        studentsCount: 12,
        maxStudents: 20,
        status: "active",
        level: "beginner"
    },
    {
        id: 2,
        title: "Стрельба",
        teacher: "Воронин М.В",
        teacherId: 2,
        days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"],
        startTime: "14:05",
        endTime: "14:45",
        color: "#2196F3",
        room: "Актовый зал",
        roomId: 9,
        studentsCount: 15,
        maxStudents: 25,
        status: "active",
        level: "beginner"
    },
    {
        id: 3,
        title: "Самбо",
        teacher: "Коваленко А.В",
        teacherId: 3,
        days: ["Понедельник", "Среда", "Пятница"],
        startTime: "17:30",
        endTime: "20:30",
        color: "#F44336",
        room: "Спортзал",
        roomId: 6,
        studentsCount: 18,
        maxStudents: 30,
        status: "active",
        level: "intermediate"
    },
    {
        id: 4,
        title: "Театральный кружок Золотой ключик",
        teacher: "Тыщенко О.Н",
        teacherId: 4,
        days: ["Вторник", "Пятница"],
        startTime: "15:00",
        endTime: "16:00",
        color: "#9C27B0",
        room: "Каб. 105",
        roomId: 2,
        studentsCount: 10,
        maxStudents: 15,
        status: "active",
        level: "beginner"
    },
    {
        id: 5,
        title: "Радиоконструирование",
        teacher: "Воронин М.В",
        teacherId: 2,
        days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"],
        startTime: "15:00",
        endTime: "18:00",
        color: "#FF9800",
        room: "Каб. 308",
        roomId: 4,
        studentsCount: 8,
        maxStudents: 12,
        status: "active",
        level: "advanced"
    },
    {
        id: 6,
        title: "Гандбол (девочки)",
        teacher: "Плакса С.А",
        teacherId: 6,
        days: ["Понедельник", "Среда", "Пятница"],
        startTime: "14:00",
        endTime: "15:30",
        color: "#E91E63",
        room: "Спорткомплекс",
        roomId: 7,
        studentsCount: 7,
        maxStudents: 10,
        status: "active",
        level: "beginner"
    },
    {
        id: 7,
        title: "Программирование",
        teacher: "Задорожный Н.А",
        teacherId: 7,
        days: ["Суббота"],
        startTime: "10:00",
        endTime: "14:00",
        color: "#3F51B5",
        room: "Каб. 310",
        roomId: 5,
        studentsCount: 14,
        maxStudents: 20,
        status: "active",
        level: "intermediate"
    },
    {
        id: 8,
        title: "Медиацентр Кадры",
        teacher: "Шорина Г.Б",
        teacherId: 5,
        days: ["Вторник", "Четверг"],
        startTime: "14:30",
        endTime: "15:30",
        color: "#00BCD4",
        room: "Каб. 310",
        roomId: 5,
        studentsCount: 11,
        maxStudents: 15,
        status: "active",
        level: "beginner"
    }
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Получить преподавателя по имени
export const getTeacherByName = (name) => {
    return TEACHERS.find(teacher => teacher.name === name);
};

// Получить кабинет по имени
export const getRoomByName = (name) => {
    return ROOMS.find(room => room.name === name);
};

// Получить цвет по ID
export const getColorById = (id) => {
    return COLORS.find(color => color.id === id);
};

// Получить день по имени
export const getDayByName = (name) => {
    return WEEK_DAYS.find(day => day.name === name);
};

// Получить статистику по занятиям
export const getActivitiesStats = (activities) => {
    const totalStudents = activities.reduce((sum, a) => sum + (a.studentsCount || 0), 0);
    const totalCapacity = activities.reduce((sum, a) => sum + (a.maxStudents || 0), 0);
    const uniqueTeachers = new Set(activities.map(a => a.teacher)).size;
    const activeActivities = activities.filter(a => a.status === 'active').length;
    const avgOccupancy = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;
    
    const levelStats = {
        beginner: activities.filter(a => a.level === 'beginner').length,
        intermediate: activities.filter(a => a.level === 'intermediate').length,
        advanced: activities.filter(a => a.level === 'advanced').length
    };
    
    const dayStats = {};
    WEEK_DAYS.forEach(day => {
        dayStats[day.name] = activities.filter(a => a.days && a.days.includes(day.name)).length;
    });
    
    return {
        totalActivities: activities.length,
        totalStudents,
        totalCapacity,
        uniqueTeachers,
        activeActivities,
        avgOccupancy: Math.round(avgOccupancy),
        levelStats,
        dayStats
    };
};

// Получить расписание на конкретный день
export const getScheduleByDay = (activities, dayName) => {
    return activities
        .filter(a => a.days && a.days.includes(dayName))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// Получить расписание преподавателя
export const getScheduleByTeacher = (activities, teacherName) => {
    return activities
        .filter(a => a.teacher === teacherName)
        .sort((a, b) => {
            const dayOrderA = WEEK_DAYS.find(d => a.days && a.days.includes(d.name))?.order || 99;
            const dayOrderB = WEEK_DAYS.find(d => b.days && b.days.includes(d.name))?.order || 99;
            if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
            return a.startTime.localeCompare(b.startTime);
        });
};

// Проверить конфликт расписания
export const checkScheduleConflict = (activities, newActivity) => {
    const conflicts = [];
    
    activities.forEach(activity => {
        if (activity.id === newActivity.id) return;
        
        newActivity.days.forEach(day => {
            if (activity.days && activity.days.includes(day)) {
                const newStart = newActivity.startTime;
                const newEnd = newActivity.endTime;
                const existStart = activity.startTime;
                const existEnd = activity.endTime;
                
                if ((newStart >= existStart && newStart < existEnd) ||
                    (newEnd > existStart && newEnd <= existEnd) ||
                    (newStart <= existStart && newEnd >= existEnd)) {
                    conflicts.push({
                        with: activity,
                        day: day,
                        message: `${activity.title} (${activity.startTime}-${activity.endTime}) в ${day}`
                    });
                }
            }
        });
    });
    
    return conflicts;
};