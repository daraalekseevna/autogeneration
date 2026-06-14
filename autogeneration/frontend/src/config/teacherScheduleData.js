// src/frontend/config/teacherScheduleData.js

export const WEEK_DAYS = [
    { id: 'monday', name: 'Понедельник', short: 'ПН', full: 'Понедельник' },
    { id: 'tuesday', name: 'Вторник', short: 'ВТ', full: 'Вторник' },
    { id: 'wednesday', name: 'Среда', short: 'СР', full: 'Среда' },
    { id: 'thursday', name: 'Четверг', short: 'ЧТ', full: 'Четверг' },
    { id: 'friday', name: 'Пятница', short: 'ПТ', full: 'Пятница' },
    { id: 'saturday', name: 'Суббота', short: 'СБ', full: 'Суббота' }
];

export const TIME_SLOTS = [
    { id: 1, value: '08:30' }, { id: 2, value: '09:25' },
    { id: 3, value: '10:20' }, { id: 4, value: '11:15' },
    { id: 5, value: '12:10' }, { id: 6, value: '13:00' },
    { id: 7, value: '14:00' }, { id: 8, value: '15:00' },
    { id: 9, value: '15:30' }, { id: 10, value: '16:00' },
    { id: 11, value: '16:30' }, { id: 12, value: '17:00' }
];

export const ALL_COLORS = [
    { id: 1, name: "Синий", code: "#2196F3" },
    { id: 2, name: "Зеленый", code: "#4CAF50" },
    { id: 3, name: "Фиолетовый", code: "#9C27B0" },
    { id: 4, name: "Оранжевый", code: "#FF9800" },
    { id: 5, name: "Красный", code: "#F44336" },
    { id: 6, name: "Розовый", code: "#E91E63" },
    { id: 7, name: "Бирюзовый", code: "#009688" },
    { id: 8, name: "Салатовый", code: "#8BC34A" },
    { id: 9, name: "Коричневый", code: "#795548" },
    { id: 10, name: "Серый", code: "#607D8B" },
    { id: 11, name: "Темно-синий", code: "#3F51B5" },
    { id: 12, name: "Голубой", code: "#00BCD4" },
    { id: 13, name: "Желтый", code: "#FFC107" },
    { id: 14, name: "Оранжево-красный", code: "#FF5722" },
    { id: 15, name: "Светло-серый", code: "#9E9E9E" },
    { id: 16, name: "Розовый пастельный", code: "#FFB6C1" },
    { id: 17, name: "Мятный", code: "#98FB98" },
    { id: 18, name: "Лавандовый", code: "#E6E6FA" },
    { id: 19, name: "Персиковый", code: "#FFDAB9" },
    { id: 20, name: "Сиреневый", code: "#D8BFD8" }
];

export const LESSON_TYPES = [
    { id: 'lesson', name: 'Урок' },
    { id: 'extracurricular', name: 'Доп. занятие' }
];