// src/frontend/config/schoolData.js

/**
 * Школьные данные
 * Содержит информацию о классах, учителях, кабинетах, предметах и расписании
 */

// ==================== КЛАССЫ ====================

export const Classes = {
  // Начальная школа (1-4 классы)
  elementary: [
    { id: '1А', name: '1А', grade: 1, letter: 'А', students: 25, classTeacher: 'Васильева Е.М.', room: '101', profile: 'общеобразовательный' },
    { id: '1Б', name: '1Б', grade: 1, letter: 'Б', students: 24, classTeacher: 'Кузнецова О.П.', room: '102', profile: 'общеобразовательный' },
    { id: '2А', name: '2А', grade: 2, letter: 'А', students: 26, classTeacher: 'Михайлова С.В.', room: '103', profile: 'общеобразовательный' },
    { id: '2Б', name: '2Б', grade: 2, letter: 'Б', students: 25, classTeacher: 'Новикова И.А.', room: '104', profile: 'общеобразовательный' },
    { id: '3А', name: '3А', grade: 3, letter: 'А', students: 27, classTeacher: 'Федорова Т.Н.', room: '105', profile: 'общеобразовательный' },
    { id: '3Б', name: '3Б', grade: 3, letter: 'Б', students: 26, classTeacher: 'Григорьева Л.С.', room: '106', profile: 'общеобразовательный' },
    { id: '4А', name: '4А', grade: 4, letter: 'А', students: 28, classTeacher: 'Андреева Е.В.', room: '107', profile: 'общеобразовательный' },
    { id: '4Б', name: '4Б', grade: 4, letter: 'Б', students: 27, classTeacher: 'Дмитриева М.И.', room: '108', profile: 'общеобразовательный' }
  ],
  
  // Средняя школа (5-9 классы)
  middle: [
    { id: '5А', name: '5А', grade: 5, letter: 'А', students: 28, classTeacher: 'Иванова А.П.', room: '201', profile: 'общеобразовательный' },
    { id: '5Б', name: '5Б', grade: 5, letter: 'Б', students: 27, classTeacher: 'Петрова С.И.', room: '202', profile: 'общеобразовательный' },
    { id: '6А', name: '6А', grade: 6, letter: 'А', students: 29, classTeacher: 'Сидорова О.В.', room: '203', profile: 'общеобразовательный' },
    { id: '6Б', name: '6Б', grade: 6, letter: 'Б', students: 28, classTeacher: 'Козлова Н.Д.', room: '204', profile: 'общеобразовательный' },
    { id: '7А', name: '7А', grade: 7, letter: 'А', students: 30, classTeacher: 'Морозова Т.П.', room: '205', profile: 'физико-математический' },
    { id: '7Б', name: '7Б', grade: 7, letter: 'Б', students: 29, classTeacher: 'Волков А.С.', room: '206', profile: 'гуманитарный' },
    { id: '8А', name: '8А', grade: 8, letter: 'А', students: 28, classTeacher: 'Соколова Е.И.', room: '207', profile: 'физико-математический' },
    { id: '8Б', name: '8Б', grade: 8, letter: 'Б', students: 27, classTeacher: 'Лебедев Д.А.', room: '208', profile: 'химико-биологический' },
    { id: '9А', name: '9А', grade: 9, letter: 'А', students: 26, classTeacher: 'Павлова М.В.', room: '209', profile: 'общеобразовательный' },
    { id: '9Б', name: '9Б', grade: 9, letter: 'Б', students: 25, classTeacher: 'Степанов И.К.', room: '210', profile: 'информационно-технологический' }
  ],
  
  // Старшая школа (10-11 классы)
  high: [
    { id: '10А', name: '10А', grade: 10, letter: 'А', students: 24, classTeacher: 'Белова Н.С.', room: '301', profile: 'физико-математический' },
    { id: '10Б', name: '10Б', grade: 10, letter: 'Б', students: 23, classTeacher: 'Тихонова Л.М.', room: '302', profile: 'химико-биологический' },
    { id: '10В', name: '10В', grade: 10, letter: 'В', students: 22, classTeacher: 'Гришин А.В.', room: '303', profile: 'гуманитарный' },
    { id: '11А', name: '11А', grade: 11, letter: 'А', students: 22, classTeacher: 'Николаева М.В.', room: '304', profile: 'физико-математический' },
    { id: '11Б', name: '11Б', grade: 11, letter: 'Б', students: 21, classTeacher: 'Алексеев В.Г.', room: '305', profile: 'социально-экономический' },
    { id: '11В', name: '11В', grade: 11, letter: 'В', students: 20, classTeacher: 'Егорова Т.С.', room: '306', profile: 'информационно-технологический' }
  ]
};

// ==================== УЧИТЕЛЯ ====================

export const Teachers = {
  // Математика
  mathematics: [
    { id: 'math_1', name: 'Иванова Анна Петровна', subject: 'Математика', qualification: 'высшая', experience: 15, room: '201' },
    { id: 'math_2', name: 'Петров Сергей Иванович', subject: 'Математика', qualification: 'первая', experience: 8, room: '202' },
    { id: 'math_3', name: 'Сидорова Ольга Владимировна', subject: 'Математика', qualification: 'высшая', experience: 20, room: '203' }
  ],
  
  // Русский язык и литература
  russian: [
    { id: 'rus_1', name: 'Кузнецова Елена Михайловна', subject: 'Русский язык', qualification: 'высшая', experience: 18, room: '305' },
    { id: 'rus_2', name: 'Михайлова Светлана Викторовна', subject: 'Литература', qualification: 'первая', experience: 12, room: '306' },
    { id: 'rus_3', name: 'Новикова Ирина Александровна', subject: 'Русский язык', qualification: 'вторая', experience: 5, room: '307' }
  ],
  
  // Иностранные языки
  foreignLanguages: [
    { id: 'eng_1', name: 'Смирнова Елена Александровна', subject: 'Английский язык', qualification: 'высшая', experience: 14, room: '401' },
    { id: 'eng_2', name: 'Волкова Наталья Сергеевна', subject: 'Английский язык', qualification: 'первая', experience: 10, room: '402' },
    { id: 'eng_3', name: 'Андреева Екатерина Викторовна', subject: 'Английский язык', qualification: 'вторая', experience: 6, room: '403' },
    { id: 'ger_1', name: 'Федоров Павел Константинович', subject: 'Немецкий язык', qualification: 'первая', experience: 9, room: '404' },
    { id: 'fr_1', name: 'Дмитриева Мария Ивановна', subject: 'Французский язык', qualification: 'первая', experience: 11, room: '405' }
  ],
  
  // Естественные науки
  naturalSciences: [
    { id: 'phys_1', name: 'Григорьев Александр Сергеевич', subject: 'Физика', qualification: 'высшая', experience: 16, room: 'Физика' },
    { id: 'chem_1', name: 'Алексеев Владимир Геннадьевич', subject: 'Химия', qualification: 'высшая', experience: 13, room: 'Лаборатория' },
    { id: 'bio_1', name: 'Николаева Мария Владимировна', subject: 'Биология', qualification: 'первая', experience: 12, room: 'Лаборатория' },
    { id: 'geo_1', name: 'Тихонова Людмила Михайловна', subject: 'География', qualification: 'первая', experience: 10, room: '307' }
  ],
  
  // Информатика и технологии
  IT: [
    { id: 'it_1', name: 'Белов Дмитрий Алексеевич', subject: 'Информатика', qualification: 'высшая', experience: 8, room: 'Компьютерный' },
    { id: 'it_2', name: 'Новикова Елена Викторовна', subject: 'Информатика', qualification: 'первая', experience: 6, room: 'Компьютерный 2' }
  ],
  
  // Гуманитарные науки
  humanities: [
    { id: 'hist_1', name: 'Морозова Татьяна Петровна', subject: 'История', qualification: 'высшая', experience: 17, room: '210' },
    { id: 'soc_1', name: 'Лебедева Ирина Анатольевна', subject: 'Обществознание', qualification: 'первая', experience: 11, room: '211' },
    { id: 'law_1', name: 'Павлов Сергей Викторович', subject: 'Право', qualification: 'вторая', experience: 5, room: '212' }
  ],
  
  // Искусство и физкультура
  arts: [
    { id: 'art_1', name: 'Волкова Наталья Сергеевна', subject: 'ИЗО', qualification: 'первая', experience: 9, room: 'ИЗО' },
    { id: 'music_1', name: 'Соколова Елена Игоревна', subject: 'Музыка', qualification: 'вторая', experience: 12, room: 'Музыка' },
    { id: 'sport_1', name: 'Козлов Дмитрий Сергеевич', subject: 'Физическая культура', qualification: 'высшая', experience: 14, room: 'Спортзал' },
    { id: 'sport_2', name: 'Степанова Ольга Викторовна', subject: 'Физическая культура', qualification: 'первая', experience: 8, room: 'Спортзал 2' }
  ],
  
  // Трудовое обучение
  technology: [
    { id: 'tech_1', name: 'Павлов Сергей Викторович', subject: 'Труд (технология)', qualification: 'вторая', experience: 7, room: 'Мастерская' }
  ]
};

// ==================== КАБИНЕТЫ ====================

export const Rooms = {
  // Учебные кабинеты
  classrooms: [
    { id: '101', name: '101', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '102', name: '102', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '103', name: '103', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '104', name: '104', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '105', name: '105', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '106', name: '106', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '107', name: '107', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '108', name: '108', type: 'classroom', capacity: 30, floor: 1, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '201', name: '201', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: true, subject: 'Математика' },
    { id: '202', name: '202', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: 'Математика' },
    { id: '203', name: '203', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '204', name: '204', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '205', name: '205', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: true, subject: null },
    { id: '206', name: '206', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '207', name: '207', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: true, subject: 'Физика' },
    { id: '208', name: '208', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '209', name: '209', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '210', name: '210', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: true, subject: 'История' },
    { id: '211', name: '211', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '212', name: '212', type: 'classroom', capacity: 35, floor: 2, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '301', name: '301', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: true, subject: null },
    { id: '302', name: '302', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '303', name: '303', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '304', name: '304', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: true, subject: null },
    { id: '305', name: '305', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: true, subject: 'Русский язык' },
    { id: '306', name: '306', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: false, subject: null },
    { id: '307', name: '307', type: 'classroom', capacity: 30, floor: 3, hasProjector: true, hasSmartBoard: false, subject: 'География' }
  ],
  
  // Специализированные кабинеты
  specialized: [
    { id: 'physics', name: 'Физика', type: 'laboratory', capacity: 30, floor: 2, hasProjector: true, hasSmartBoard: true, equipment: 'Лабораторное оборудование, демонстрационные стенды', subject: 'Физика' },
    { id: 'chemistry', name: 'Химия', type: 'laboratory', capacity: 30, floor: 2, hasProjector: true, hasSmartBoard: true, equipment: 'Химические реактивы, лабораторное оборудование, вытяжной шкаф', subject: 'Химия' },
    { id: 'biology', name: 'Биология', type: 'laboratory', capacity: 30, floor: 2, hasProjector: true, hasSmartBoard: true, equipment: 'Микроскопы, гербарии, влажные препараты', subject: 'Биология' },
    { id: 'computer1', name: 'Компьютерный', type: 'computer', capacity: 25, floor: 3, hasProjector: true, hasSmartBoard: true, computers: 25, subject: 'Информатика' },
    { id: 'computer2', name: 'Компьютерный 2', type: 'computer', capacity: 20, floor: 3, hasProjector: true, hasSmartBoard: false, computers: 20, subject: 'Информатика' }
  ],
  
  // Спортивные сооружения
  sports: [
    { id: 'gym1', name: 'Спортзал', type: 'gym', capacity: 60, floor: 1, equipment: 'Спортивный инвентарь, шведские стенки, маты' },
    { id: 'gym2', name: 'Спортзал 2', type: 'gym', capacity: 40, floor: 1, equipment: 'Спортивный инвентарь' }
  ],
  
  // Творческие мастерские
  creative: [
    { id: 'art', name: 'ИЗО', type: 'art', capacity: 25, floor: 2, hasProjector: true, equipment: 'Мольберты, натюрмортный фонд' },
    { id: 'music', name: 'Музыка', type: 'music', capacity: 30, floor: 2, hasProjector: true, equipment: 'Музыкальные инструменты, аудиосистема' },
    { id: 'workshop', name: 'Мастерская', type: 'workshop', capacity: 20, floor: 1, equipment: 'Станки, инструменты, верстаки' }
  ]
};

// ==================== ПРЕДМЕТЫ ====================

export const Subjects = {
  // Основные предметы
  main: [
    { id: 'math', name: 'Математика', shortName: 'Мат', hoursPerWeek: 5, color: '#4CAF50', icon: 'calculator' },
    { id: 'algebra', name: 'Алгебра', shortName: 'Алг', hoursPerWeek: 4, color: '#4CAF50', icon: 'function' },
    { id: 'geometry', name: 'Геометрия', shortName: 'Геом', hoursPerWeek: 2, color: '#4CAF50', icon: 'shape' },
    { id: 'russian', name: 'Русский язык', shortName: 'Рус', hoursPerWeek: 4, color: '#2196F3', icon: 'book' },
    { id: 'literature', name: 'Литература', shortName: 'Лит', hoursPerWeek: 3, color: '#9C27B0', icon: 'book-open' },
    { id: 'english', name: 'Английский язык', shortName: 'Англ', hoursPerWeek: 3, color: '#FF9800', icon: 'language' },
    { id: 'history', name: 'История', shortName: 'Ист', hoursPerWeek: 2, color: '#795548', icon: 'history' },
    { id: 'social', name: 'Обществознание', shortName: 'Общ', hoursPerWeek: 1, color: '#607D8B', icon: 'users' },
    { id: 'physics', name: 'Физика', shortName: 'Физ', hoursPerWeek: 2, color: '#FF5722', icon: 'atom' },
    { id: 'chemistry', name: 'Химия', shortName: 'Хим', hoursPerWeek: 2, color: '#009688', icon: 'flask' },
    { id: 'biology', name: 'Биология', shortName: 'Био', hoursPerWeek: 2, color: '#8BC34A', icon: 'leaf' },
    { id: 'geography', name: 'География', shortName: 'Гео', hoursPerWeek: 2, color: '#3F51B5', icon: 'map' },
    { id: 'informatics', name: 'Информатика', shortName: 'Инф', hoursPerWeek: 2, color: '#E91E63', icon: 'computer' }
  ],
  
  // Дополнительные предметы
  additional: [
    { id: 'pe', name: 'Физическая культура', shortName: 'Физ-ра', hoursPerWeek: 3, color: '#F44336', icon: 'running' },
    { id: 'art', name: 'Изобразительное искусство', shortName: 'ИЗО', hoursPerWeek: 1, color: '#FFC107', icon: 'palette' },
    { id: 'music', name: 'Музыка', shortName: 'Муз', hoursPerWeek: 1, color: '#00BCD4', icon: 'music' },
    { id: 'technology', name: 'Труд (технология)', shortName: 'Труд', hoursPerWeek: 2, color: '#FF9800', icon: 'tools' },
    { id: 'classHour', name: 'Классный час', shortName: 'Кл.час', hoursPerWeek: 1, color: '#9E9E9E', icon: 'users' }
  ],
  
  // Элективные курсы (10-11 классы)
  elective: [
    { id: 'math_extra', name: 'Дополнительная математика', shortName: 'Мат+(эл)', hoursPerWeek: 1, color: '#4CAF50', icon: 'calculator' },
    { id: 'phys_extra', name: 'Дополнительная физика', shortName: 'Физ+(эл)', hoursPerWeek: 1, color: '#FF5722', icon: 'atom' },
    { id: 'rus_extra', name: 'Подготовка к ЕГЭ по русскому', shortName: 'Рус(эл)', hoursPerWeek: 1, color: '#2196F3', icon: 'book' },
    { id: 'it_extra', name: 'Программирование', shortName: 'Прогр(эл)', hoursPerWeek: 1, color: '#E91E63', icon: 'code' }
  ]
};

// ==================== ВРЕМЯ УРОКОВ ====================

export const ScheduleTimes = {
  // Смены
  shifts: [
    { id: 'first', name: 'Первая смена', startTime: '08:30', endTime: '13:30' },
    { id: 'second', name: 'Вторая смена', startTime: '14:00', endTime: '19:00' }
  ],
  
  // Уроки для 1-й смены
  firstShiftLessons: [
    { number: 1, startTime: '08:30', endTime: '09:15', duration: 45 },
    { number: 2, startTime: '09:25', endTime: '10:10', duration: 45 },
    { number: 3, startTime: '10:20', endTime: '11:05', duration: 45 },
    { number: 4, startTime: '11:15', endTime: '12:00', duration: 45 },
    { number: 5, startTime: '12:10', endTime: '12:55', duration: 45 },
    { number: 6, startTime: '13:05', endTime: '13:50', duration: 45 },
    { number: 7, startTime: '14:00', endTime: '14:45', duration: 45 }
  ],
  
  // Уроки для 2-й смены
  secondShiftLessons: [
    { number: 1, startTime: '14:00', endTime: '14:45', duration: 45 },
    { number: 2, startTime: '14:55', endTime: '15:40', duration: 45 },
    { number: 3, startTime: '15:50', endTime: '16:35', duration: 45 },
    { number: 4, startTime: '16:45', endTime: '17:30', duration: 45 },
    { number: 5, startTime: '17:40', endTime: '18:25', duration: 45 },
    { number: 6, startTime: '18:35', endTime: '19:20', duration: 45 }
  ],
  
  // Перемены
  breaks: [
    { afterLesson: 1, duration: 10, type: 'short' },
    { afterLesson: 2, duration: 10, type: 'short' },
    { afterLesson: 3, duration: 20, type: 'long', name: 'Большая перемена' },
    { afterLesson: 4, duration: 10, type: 'short' },
    { afterLesson: 5, duration: 10, type: 'short' },
    { afterLesson: 6, duration: 10, type: 'short' }
  ]
};

// ==================== ДНИ НЕДЕЛИ ====================

export const WeekDays = [
  { id: 'monday', name: 'Понедельник', shortName: 'Пн', order: 1, isWeekend: false },
  { id: 'tuesday', name: 'Вторник', shortName: 'Вт', order: 2, isWeekend: false },
  { id: 'wednesday', name: 'Среда', shortName: 'Ср', order: 3, isWeekend: false },
  { id: 'thursday', name: 'Четверг', shortName: 'Чт', order: 4, isWeekend: false },
  { id: 'friday', name: 'Пятница', shortName: 'Пт', order: 5, isWeekend: false },
  { id: 'saturday', name: 'Суббота', shortName: 'Сб', order: 6, isWeekend: true },
  { id: 'sunday', name: 'Воскресенье', shortName: 'Вс', order: 7, isWeekend: true }
];

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Получить все классы в виде массива
export const getAllClasses = () => {
  return [...Classes.elementary, ...Classes.middle, ...Classes.high];
};

// Получить всех учителей в виде массива
export const getAllTeachers = () => {
  return [
    ...Teachers.mathematics,
    ...Teachers.russian,
    ...Teachers.foreignLanguages,
    ...Teachers.naturalSciences,
    ...Teachers.IT,
    ...Teachers.humanities,
    ...Teachers.arts,
    ...Teachers.technology
  ];
};

// Получить все кабинеты в виде массива
export const getAllRooms = () => {
  return [...Rooms.classrooms, ...Rooms.specialized, ...Rooms.sports, ...Rooms.creative];
};

// Получить все предметы в виде массива
export const getAllSubjects = () => {
  return [...Subjects.main, ...Subjects.additional, ...Subjects.elective];
};

// Получить учителя по ID
export const getTeacherById = (id) => {
  return getAllTeachers().find(teacher => teacher.id === id);
};

// Получить кабинет по ID
export const getRoomById = (id) => {
  return getAllRooms().find(room => room.id === id);
};

// Получить класс по названию
export const getClassByName = (className) => {
  return getAllClasses().find(cls => cls.name === className);
};

// Получить предмет по ID
export const getSubjectById = (id) => {
  return getAllSubjects().find(subject => subject.id === id);
};

// Получить учителей по предмету
export const getTeachersBySubject = (subjectName) => {
  return getAllTeachers().filter(teacher => teacher.subject === subjectName);
};

// Получить кабинеты по типу
export const getRoomsByType = (type) => {
  if (type === 'classroom') return Rooms.classrooms;
  if (type === 'specialized') return Rooms.specialized;
  if (type === 'sports') return Rooms.sports;
  if (type === 'creative') return Rooms.creative;
  return getAllRooms();
};

// Получить классы по параллели
export const getClassesByGrade = (grade) => {
  return getAllClasses().filter(cls => cls.grade === grade);
};

// Получить расписание для класса
export const getScheduleForClass = (className, day = null) => {
  // Здесь будет логика получения расписания из базы данных
  // Пока возвращаем пустой объект
  return {};
};

// Проверка доступности кабинета
export const isRoomAvailable = (roomId, day, lessonNumber) => {
  // Здесь будет логика проверки доступности
  return true;
};

// Проверка занятости учителя
export const isTeacherAvailable = (teacherId, day, lessonNumber) => {
  // Здесь будет логика проверки занятости
  return true;
};

// Получить максимальную нагрузку учителя (часов в неделю)
export const getTeacherMaxHours = (teacherId) => {
  const teacher = getTeacherById(teacherId);
  if (teacher?.qualification === 'высшая') return 24;
  if (teacher?.qualification === 'первая') return 22;
  return 20;
};

// Получить текущую нагрузку учителя
export const getTeacherCurrentHours = (teacherId) => {
  // Здесь будет логика расчета нагрузки
  return 0;
};

// Статистика по школе
export const getSchoolStats = () => {
  const allClasses = getAllClasses();
  const allTeachers = getAllTeachers();
  const allRooms = getAllRooms();
  
  const subjectsCount = getAllSubjects().length;
  const teachersBySubject = {};
  allTeachers.forEach(teacher => {
    teachersBySubject[teacher.subject] = (teachersBySubject[teacher.subject] || 0) + 1;
  });
  
  return {
    totalClasses: allClasses.length,
    totalStudents: allClasses.reduce((sum, cls) => sum + cls.students, 0),
    totalTeachers: allTeachers.length,
    totalRooms: allRooms.length,
    totalSubjects: subjectsCount,
    averageClassSize: Math.round(allClasses.reduce((sum, cls) => sum + cls.students, 0) / allClasses.length),
    teachersBySubject: teachersBySubject,
    byGrade: {
      elementary: Classes.elementary.length,
      middle: Classes.middle.length,
      high: Classes.high.length
    },
    roomsByType: {
      classrooms: Rooms.classrooms.length,
      specialized: Rooms.specialized.length,
      sports: Rooms.sports.length,
      creative: Rooms.creative.length
    }
  };
};

// Поиск по учителям
export const searchTeachers = (query) => {
  const lowerQuery = query.toLowerCase();
  return getAllTeachers().filter(teacher => 
    teacher.name.toLowerCase().includes(lowerQuery) ||
    teacher.subject.toLowerCase().includes(lowerQuery) ||
    teacher.qualification.toLowerCase().includes(lowerQuery)
  );
};

// Поиск по кабинетам
export const searchRooms = (query) => {
  const lowerQuery = query.toLowerCase();
  return getAllRooms().filter(room => 
    room.name.toLowerCase().includes(lowerQuery) ||
    (room.type && room.type.toLowerCase().includes(lowerQuery))
  );
};

export default {
  Classes,
  Teachers,
  Rooms,
  Subjects,
  ScheduleTimes,
  WeekDays,
  getAllClasses,
  getAllTeachers,
  getAllRooms,
  getAllSubjects,
  getTeacherById,
  getRoomById,
  getClassByName,
  getSubjectById,
  getTeachersBySubject,
  getRoomsByType,
  getClassesByGrade,
  getScheduleForClass,
  isRoomAvailable,
  isTeacherAvailable,
  getTeacherMaxHours,
  getTeacherCurrentHours,
  getSchoolStats,
  searchTeachers,
  searchRooms
};