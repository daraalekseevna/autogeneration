// src/frontend/data/teacherClassData.js

// Информация о классах школы
export const classesData = [
    {
        id: 1,
        name: "5А",
        shift: 1,
        teacherId: 1,
        teacherName: "Иванова Анна Петровна",
        studentsCount: 25,
        year: 2024,
        classroom: "201"
    },
    {
        id: 2,
        name: "5Б",
        shift: 1,
        teacherId: 2,
        teacherName: "Петрова Елена Сергеевна",
        studentsCount: 24,
        year: 2024,
        classroom: "202"
    },
    {
        id: 3,
        name: "6А",
        shift: 1,
        teacherId: 3,
        teacherName: "Сидорова Мария Ивановна",
        studentsCount: 2,
        year: 2024,
        classroom: "203"
    },
    {
        id: 4,
        name: "7Б",
        shift: 2,
        teacherId: 4,
        teacherName: "Козлов Дмитрий Сергеевич",
        studentsCount: 26,
        year: 2024,
        classroom: "210"
    },
    {
        id: 5,
        name: "8В",
        shift: 2,
        teacherId: 5,
        teacherName: "Морозова Татьяна Петровна",
        studentsCount: 27,
        year: 2024,
        classroom: "211"
    }
];

// Расписание для каждого класса (в формате как у учителя - по дням)
export const classScheduleData = {
    "6А": [
        {
            day: "Понедельник",
            shortName: "ПН",
            lessons: [
                { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
                { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
                { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
                { time: "10:20 - 11:05", subject: "Литература", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" }
            ]
        },
        {
            day: "Вторник",
            shortName: "ВТ",
            lessons: [
                { time: "08:30 - 09:15", subject: "Физика", room: "Физика", teacher: "Григорьев Александр Сергеевич", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Английский язык", room: "401", teacher: "Смирнова Елена Александровна", type: "lesson" },
                { time: "14:00 - 15:30", subject: "Математический кружок", room: "203", teacher: "Сидорова Мария Ивановна", type: "extracurricular" }
            ]
        },
        {
            day: "Среда",
            shortName: "СР",
            lessons: [
                { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "История", room: "210", teacher: "Морозова Татьяна Петровна", type: "lesson" },
                { time: "10:20 - 11:05", subject: "География", room: "307", teacher: "Тихонова Людмила Михайловна", type: "lesson" }
            ]
        },
        {
            day: "Четверг",
            shortName: "ЧТ",
            lessons: [
                { time: "08:30 - 09:15", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
               { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
                { time: "08:30 - 09:15", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "306", teacher: "Михайлова Светлана Викторовна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Биология", room: "Лаборатория", teacher: "Николаева Мария Владимировна", type: "lesson" },
                { time: "10:20 - 11:05", subject: "Английский язык", room: "401", teacher: "Смирнова Елена Александровна", type: "lesson" }
            ]
        },
        {
            day: "Пятница",
            shortName: "ПТ",
            lessons: [
                { time: "08:30 - 09:15", subject: "Физкультура", room: "Спортзал", teacher: "Козлов Дмитрий Сергеевич", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Математика", room: "203", teacher: "Сидорова Мария Ивановна", type: "lesson" },
                { time: "10:20 - 11:05", subject: "ИЗО", room: "ИЗО", teacher: "Волкова Наталья Сергеевна", type: "lesson" }
            ]
        },
        {
            day: "Суббота",
            shortName: "СБ",
            lessons: []
        }
    ],
    "5А": [
        {
            day: "Понедельник",
            shortName: "ПН",
            lessons: [
                { time: "08:30 - 09:15", subject: "Математика", room: "201", teacher: "Иванова Анна Петровна", type: "lesson" },
                { time: "09:25 - 10:10", subject: "Русский язык", room: "305", teacher: "Кузнецова Елена Михайловна", type: "lesson" }
            ]
        },
        {
            day: "Вторник",
            shortName: "ВТ",
            lessons: [
                { time: "08:30 - 09:15", subject: "Английский язык", room: "401", teacher: "Смирнова Елена Александровна", type: "lesson" }
            ]
        }
    ]
};

// Цвета предметов
export const subjectColors = {
    "Математика": "#2196F3",
    "Русский язык": "#4CAF50",
    "Литература": "#9C27B0",
    "Физическая культура": "#FF9800",
    "Физкультура": "#FF9800",
    "Английский язык": "#E91E63",
    "История": "#795548",
    "Физика": "#00BCD4",
    "Химия": "#FF5722",
    "Информатика": "#3F51B5",
    "Геометрия": "#8BC34A",
    "Алгебра": "#009688",
    "Биология": "#8BC34A",
    "Обществознание": "#607D8B",
    "География": "#FFC107",
    "ИЗО": "#E91E63",
    "Музыка": "#9C27B0",
    "Труд": "#FF9800",
    "Математический кружок": "#FF9800"
};

// Получить расписание по классу
export const getScheduleByClass = (className) => {
    return classScheduleData[className] || [];
};

// Получить класс учителя по ID учителя
export const getTeacherClass = (teacherId) => {
    // Для демо возвращаем 6А класс (teacherId = 3)
    return classesData.find(c => c.id === 3);
};