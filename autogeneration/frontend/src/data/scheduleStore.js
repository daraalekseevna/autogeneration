// src/data/scheduleStore.js - Хранилище данных расписания (мини-бэкенд)

// ============ КОНСТАНТЫ ============

// Список всех классов школы
export const CLASSES = [
  '1А', '1Б', '2А', '2Б', '3А', '3Б',
  '4А', '4Б', '5А', '5Б', '6А', '6Б',
  '7А', '7Б', '8А', '8Б', '9А', '9Б',
  '10А', '10Б', '11А'
];

// Дни недели
export const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
export const FULL_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// Время уроков
export const TIME_SLOTS = [
  { number: 1, start: '08:30', end: '09:15', label: '1 урок' },
  { number: 2, start: '09:25', end: '10:10', label: '2 урок' },
  { number: 3, start: '10:20', end: '11:05', label: '3 урок' },
  { number: 4, start: '11:20', end: '12:05', label: '4 урок' },
  { number: 5, start: '12:15', end: '13:00', label: '5 урок' },
  { number: 6, start: '13:10', end: '13:55', label: '6 урок' },
  { number: 7, start: '14:05', end: '14:50', label: '7 урок' },
  { number: 8, start: '15:00', end: '15:45', label: '8 урок' }
];

// ============ ДАННЫЕ УЧИТЕЛЕЙ ============

export const TEACHERS = [
  { id: 't1', name: 'Иванова А.П.', subject: 'Математика', room: '201', shortName: 'Иванова А.П.' },
  { id: 't2', name: 'Петрова С.И.', subject: 'Русский язык', room: '305', shortName: 'Петрова С.И.' },
  { id: 't3', name: 'Сидорова О.В.', subject: 'Литература', room: '208', shortName: 'Сидорова О.В.' },
  { id: 't4', name: 'Козлов Д.С.', subject: 'Физкультура', room: 'Спортзал', shortName: 'Козлов Д.С.' },
  { id: 't5', name: 'Смирнова Е.А.', subject: 'Английский язык', room: '401', shortName: 'Смирнова Е.А.' },
  { id: 't6', name: 'Федоров П.К.', subject: 'История', room: '312', shortName: 'Федоров П.К.' },
  { id: 't7', name: 'Николаева М.В.', subject: 'Биология', room: 'Лаборатория', shortName: 'Николаева М.В.' },
  { id: 't8', name: 'Алексеев В.Г.', subject: 'Химия', room: 'Лаборатория', shortName: 'Алексеев В.Г.' },
  { id: 't9', name: 'Григорьев А.С.', subject: 'Физика', room: 'Физика', shortName: 'Григорьев А.С.' },
  { id: 't10', name: 'Тихонова Л.М.', subject: 'География', room: '307', shortName: 'Тихонова Л.М.' },
  { id: 't11', name: 'Белов Д.А.', subject: 'Информатика', room: 'Компьютерный', shortName: 'Белов Д.А.' },
  { id: 't12', name: 'Морозова Т.П.', subject: 'Обществознание', room: '210', shortName: 'Морозова Т.П.' },
  { id: 't13', name: 'Волкова Н.С.', subject: 'ИЗО', room: 'ИЗО', shortName: 'Волкова Н.С.' },
  { id: 't14', name: 'Лебедева И.А.', subject: 'Музыка', room: 'Музыка', shortName: 'Лебедева И.А.' },
  { id: 't15', name: 'Павлов С.В.', subject: 'Труд', room: 'Мастерская', shortName: 'Павлов С.В.' }
];

// ============ ДАННЫЕ КАБИНЕТОВ ============

export const ROOMS = [
  { id: 'r1', number: '101', building: 'Основное здание', floor: 1 },
  { id: 'r2', number: '102', building: 'Основное здание', floor: 1 },
  { id: 'r3', number: '103', building: 'Основное здание', floor: 1 },
  { id: 'r4', number: '201', building: 'Основное здание', floor: 2 },
  { id: 'r5', number: '202', building: 'Основное здание', floor: 2 },
  { id: 'r6', number: '203', building: 'Основное здание', floor: 2 },
  { id: 'r7', number: '204', building: 'Основное здание', floor: 2 },
  { id: 'r8', number: '205', building: 'Основное здание', floor: 2 },
  { id: 'r9', number: '301', building: 'Основное здание', floor: 3 },
  { id: 'r10', number: '302', building: 'Основное здание', floor: 3 },
  { id: 'r11', number: '303', building: 'Основное здание', floor: 3 },
  { id: 'r12', number: '304', building: 'Основное здание', floor: 3 },
  { id: 'r13', number: '305', building: 'Основное здание', floor: 3 },
  { id: 'r14', number: '306', building: 'Основное здание', floor: 3 },
  { id: 'r15', number: '307', building: 'Основное здание', floor: 3 },
  { id: 'r16', number: '401', building: 'Основное здание', floor: 4 },
  { id: 'r17', number: '402', building: 'Основное здание', floor: 4 },
  { id: 'r18', number: 'Спортзал', building: 'Спортивный корпус', floor: 1 },
  { id: 'r19', number: 'Лаборатория', building: 'Научный корпус', floor: 2 },
  { id: 'r20', number: 'Компьютерный', building: 'Информационный корпус', floor: 2 },
  { id: 'r21', number: 'Актовый зал', building: 'Основное здание', floor: 2 },
  { id: 'r22', number: 'ИЗО', building: 'Основное здание', floor: 3 },
  { id: 'r23', number: 'Музыка', building: 'Основное здание', floor: 3 },
  { id: 'r24', number: 'Мастерская', building: 'Хозяйственный корпус', floor: 1 }
];

// ============ ЦВЕТА ПРЕДМЕТОВ ============

export const SUBJECT_COLORS = {
  'Математика': '#4CAF50',
  'Русский язык': '#2196F3',
  'Литература': '#9C27B0',
  'Английский язык': '#FF9800',
  'Физкультура': '#F44336',
  'История': '#795548',
  'Обществознание': '#607D8B',
  'Биология': '#8BC34A',
  'Химия': '#009688',
  'Физика': '#FF5722',
  'География': '#3F51B5',
  'Информатика': '#E91E63',
  'ИЗО': '#FFC107',
  'Музыка': '#00BCD4',
  'Труд': '#FF9800',
  'Классный час': '#9E9E9E'
};

export const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || '#9E9E9E';

// ============ БАЗОВОЕ РАСПИСАНИЕ (ДЕФОЛТНОЕ) ============

// Базовое расписание для одного класса
const getDefaultScheduleForClass = (className) => {
  const schedule = {};
  
  DAYS.forEach(day => {
    schedule[day] = {};
    
    TIME_SLOTS.forEach(slot => {
      const num = slot.number;
      
      // Заполняем базовыми уроками
      if (num === 1) {
        schedule[day][num] = {
          subject: 'Математика',
          teacher: 'Иванова А.П.',
          room: '201'
        };
      } else if (num === 2) {
        schedule[day][num] = {
          subject: 'Русский язык',
          teacher: 'Петрова С.И.',
          room: '305'
        };
      } else if (num === 3) {
        schedule[day][num] = {
          subject: 'Литература',
          teacher: 'Сидорова О.В.',
          room: '208'
        };
      } else if (num === 4) {
        schedule[day][num] = {
          subject: 'Английский язык',
          teacher: 'Смирнова Е.А.',
          room: '401'
        };
      } else if (num === 5) {
        schedule[day][num] = {
          subject: 'Физика',
          teacher: 'Григорьев А.С.',
          room: 'Физика'
        };
      } else if (num === 6) {
        schedule[day][num] = {
          subject: 'История',
          teacher: 'Федоров П.К.',
          room: '312'
        };
      } else if (num === 7) {
        schedule[day][num] = {
          subject: 'Биология',
          teacher: 'Николаева М.В.',
          room: 'Лаборатория'
        };
      } else {
        schedule[day][num] = null;
      }
    });
  });
  
  return schedule;
};

// ============ КЛАСС ДЛЯ РАБОТЫ С ДАННЫМИ ============

class ScheduleStore {
  constructor() {
    this.schedules = null;
    this.listeners = [];
    this.loadFromLocalStorage();
  }
  
  // Загрузка из localStorage
  loadFromLocalStorage() {
    const saved = localStorage.getItem('school_schedules');
    if (saved) {
      try {
        this.schedules = JSON.parse(saved);
      } catch (e) {
        console.error('Ошибка загрузки данных:', e);
        this.initDefaultSchedules();
      }
    } else {
      this.initDefaultSchedules();
    }
  }
  
  // Инициализация дефолтных расписаний
  initDefaultSchedules() {
    this.schedules = {};
    CLASSES.forEach(className => {
      this.schedules[className] = getDefaultScheduleForClass(className);
    });
    this.saveToLocalStorage();
  }
  
  // Сохранение в localStorage
  saveToLocalStorage() {
    localStorage.setItem('school_schedules', JSON.stringify(this.schedules));
  }
  
  // Получить расписание класса
  getSchedule(className) {
    return this.schedules[className] || {};
  }
  
  // Получить все расписания
  getAllSchedules() {
    return this.schedules;
  }
  
  // Обновить урок
  updateLesson(className, day, lessonNumber, lessonData) {
    if (!this.schedules[className]) {
      this.schedules[className] = {};
    }
    if (!this.schedules[className][day]) {
      this.schedules[className][day] = {};
    }
    
    if (lessonData && (lessonData.subject || lessonData.teacher || lessonData.room)) {
      this.schedules[className][day][lessonNumber] = { ...lessonData };
    } else {
      delete this.schedules[className][day][lessonNumber];
    }
    
    this.saveToLocalStorage();
    this.notifyListeners();
    return true;
  }
  
  // Удалить урок
  deleteLesson(className, day, lessonNumber) {
    if (this.schedules[className]?.[day]?.[lessonNumber]) {
      delete this.schedules[className][day][lessonNumber];
      this.saveToLocalStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }
  
  // Переместить урок (drag & drop)
  moveLesson(sourceClass, sourceDay, sourceLesson, targetClass, targetDay, targetLesson) {
    const sourceLessonData = this.schedules[sourceClass]?.[sourceDay]?.[sourceLesson];
    
    if (!sourceLessonData) return false;
    
    // Копируем данные урока
    const lessonCopy = { ...sourceLessonData };
    
    // Удаляем из источника
    this.deleteLesson(sourceClass, sourceDay, sourceLesson);
    
    // Добавляем в цель
    this.updateLesson(targetClass, targetDay, targetLesson, lessonCopy);
    
    this.saveToLocalStorage();
    this.notifyListeners();
    return true;
  }
  
  // Копировать урок
  copyLesson(sourceClass, sourceDay, sourceLesson) {
    const lesson = this.schedules[sourceClass]?.[sourceDay]?.[sourceLesson];
    return lesson ? { ...lesson } : null;
  }
  
  // Вставить урок
  pasteLesson(targetClass, targetDay, targetLesson, copiedLesson) {
    if (copiedLesson) {
      this.updateLesson(targetClass, targetDay, targetLesson, copiedLesson);
      return true;
    }
    return false;
  }
  
  // Сбросить расписание класса к дефолтному
  resetClassSchedule(className) {
    this.schedules[className] = getDefaultScheduleForClass(className);
    this.saveToLocalStorage();
    this.notifyListeners();
    return true;
  }
  
  // Сбросить все расписания
  resetAllSchedules() {
    this.initDefaultSchedules();
    this.notifyListeners();
    return true;
  }
  
  // Экспорт данных в JSON
  exportToJSON() {
    return JSON.stringify(this.schedules, null, 2);
  }
  
  // Импорт данных из JSON
  importFromJSON(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      this.schedules = data;
      this.saveToLocalStorage();
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('Ошибка импорта:', e);
      return false;
    }
  }
  
  // Проверка конфликтов для учителя
  checkTeacherConflicts(teacherName, day, lessonNumber, excludeClass = null) {
    const conflicts = [];
    
    Object.entries(this.schedules).forEach(([className, schedule]) => {
      if (excludeClass === className) return;
      
      const lessonAtTime = schedule[day]?.[lessonNumber];
      if (lessonAtTime?.teacher === teacherName) {
        conflicts.push({
          class: className,
          day,
          lesson: lessonNumber,
          teacher: teacherName,
          subject: lessonAtTime.subject
        });
      }
    });
    
    return conflicts;
  }
  
  // Проверка конфликтов для кабинета
  checkRoomConflicts(roomName, day, lessonNumber, excludeClass = null) {
    const conflicts = [];
    
    Object.entries(this.schedules).forEach(([className, schedule]) => {
      if (excludeClass === className) return;
      
      const lessonAtTime = schedule[day]?.[lessonNumber];
      if (lessonAtTime?.room === roomName) {
        conflicts.push({
          class: className,
          day,
          lesson: lessonNumber,
          room: roomName,
          subject: lessonAtTime.subject
        });
      }
    });
    
    return conflicts;
  }
  
  // Получить всех учителей
  getAllTeachers() {
    return TEACHERS;
  }
  
  // Получить все кабинеты
  getAllRooms() {
    return ROOMS;
  }
  
  // Получить список предметов
  getAllSubjects() {
    return Object.keys(SUBJECT_COLORS);
  }
  
  // Подписка на изменения
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // Уведомление подписчиков
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.schedules));
  }
  
  // Статистика
  getStats() {
    let totalLessons = 0;
    let emptySlots = 0;
    const totalSlots = CLASSES.length * DAYS.length * TIME_SLOTS.length;
    
    Object.values(this.schedules).forEach(schedule => {
      Object.values(schedule).forEach(day => {
        totalLessons += Object.keys(day).length;
      });
    });
    
    emptySlots = totalSlots - totalLessons;
    
    return {
      totalClasses: CLASSES.length,
      totalLessons,
      emptySlots,
      totalSlots,
      fillPercentage: Math.round((totalLessons / totalSlots) * 100)
    };
  }
}

// Создаем единственный экземпляр хранилища
const scheduleStore = new ScheduleStore();

export default scheduleStore;