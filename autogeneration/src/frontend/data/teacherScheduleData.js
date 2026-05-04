// src/frontend/data/teacherScheduleData.js

export const WEEK_DAYS = [
    { id: 'monday', name: 'Понедельник', short: 'ПН' },
    { id: 'tuesday', name: 'Вторник', short: 'ВТ' },
    { id: 'wednesday', name: 'Среда', short: 'СР' },
    { id: 'thursday', name: 'Четверг', short: 'ЧТ' },
    { id: 'friday', name: 'Пятница', short: 'ПТ' },
    { id: 'saturday', name: 'Суббота', short: 'СБ' }
];

export const TIME_SLOTS = [
    { id: 1, value: '08:30' }, { id: 2, value: '09:25' },
    { id: 3, value: '10:20' }, { id: 4, value: '11:15' },
    { id: 5, value: '12:10' }, { id: 6, value: '13:00' },
    { id: 7, value: '14:00' }, { id: 8, value: '15:00' },
    { id: 9, value: '16:00' }, { id: 10, value: '17:00' }
];

// Начальные данные расписания учителя
export const initialScheduleData = [
    {
        id: 1,
        dayId: 'monday',
        day: 'Понедельник',
        time: '08:30 - 09:15',
        subject: 'Математика',
        className: '5А',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 2,
        dayId: 'monday',
        day: 'Понедельник',
        time: '09:25 - 10:10',
        subject: 'Алгебра',
        className: '7Б',
        room: '203',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 3,
        dayId: 'monday',
        day: 'Понедельник',
        time: '10:20 - 11:05',
        subject: 'Геометрия',
        className: '8В',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 4,
        dayId: 'monday',
        day: 'Понедельник',
        time: '11:15 - 12:00',
        subject: 'Математика',
        className: '6А',
        room: '202',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 5,
        dayId: 'tuesday',
        day: 'Вторник',
        time: '08:30 - 09:15',
        subject: 'Геометрия',
        className: '7Б',
        room: '203',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 6,
        dayId: 'tuesday',
        day: 'Вторник',
        time: '09:25 - 10:10',
        subject: 'Математика',
        className: '5А',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 7,
        dayId: 'tuesday',
        day: 'Вторник',
        time: '10:20 - 11:05',
        subject: 'Алгебра',
        className: '8В',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 8,
        dayId: 'tuesday',
        day: 'Вторник',
        time: '14:00 - 15:30',
        subject: 'Математический кружок',
        className: '5-6 классы',
        room: '201',
        type: 'extracurricular',
        color: '#f59e0b'
    },
    {
        id: 9,
        dayId: 'wednesday',
        day: 'Среда',
        time: '08:30 - 09:15',
        subject: 'Математика',
        className: '6А',
        room: '202',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 10,
        dayId: 'wednesday',
        day: 'Среда',
        time: '09:25 - 10:10',
        subject: 'Алгебра',
        className: '7Б',
        room: '203',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 11,
        dayId: 'wednesday',
        day: 'Среда',
        time: '10:20 - 11:05',
        subject: 'Геометрия',
        className: '8В',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 12,
        dayId: 'thursday',
        day: 'Четверг',
        time: '08:30 - 09:15',
        subject: 'Алгебра',
        className: '8В',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 13,
        dayId: 'thursday',
        day: 'Четверг',
        time: '09:25 - 10:10',
        subject: 'Математика',
        className: '5А',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 14,
        dayId: 'thursday',
        day: 'Четверг',
        time: '10:20 - 11:05',
        subject: 'Геометрия',
        className: '7Б',
        room: '203',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 15,
        dayId: 'thursday',
        day: 'Четверг',
        time: '15:30 - 17:00',
        subject: 'Подготовка к ОГЭ',
        className: '9 классы',
        room: '201',
        type: 'extracurricular',
        color: '#f59e0b'
    },
    {
        id: 16,
        dayId: 'friday',
        day: 'Пятница',
        time: '08:30 - 09:15',
        subject: 'Математика',
        className: '6А',
        room: '202',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 17,
        dayId: 'friday',
        day: 'Пятница',
        time: '09:25 - 10:10',
        subject: 'Алгебра',
        className: '7Б',
        room: '203',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 18,
        dayId: 'friday',
        day: 'Пятница',
        time: '10:20 - 11:05',
        subject: 'Классный час',
        className: '5А',
        room: '201',
        type: 'lesson',
        color: '#3b82f6'
    },
    {
        id: 19,
        dayId: 'saturday',
        day: 'Суббота',
        time: '09:00 - 10:30',
        subject: 'Олимпиадная математика',
        className: '7-8 классы',
        room: '201',
        type: 'extracurricular',
        color: '#f59e0b'
    }
];