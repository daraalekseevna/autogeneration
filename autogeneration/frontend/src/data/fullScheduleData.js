import { getAllClasses, WeekDays, ScheduleTimes } from '../config/schoolData';

export const getScheduleKey = (className) => `schedule_${className}`;

export const loadClassSchedule = (className) => {
  const key = getScheduleKey(className);
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  const empty = {};
  WeekDays.filter(day => !day.isWeekend).forEach(day => { empty[day.id] = {}; });
  return empty;
};

export const loadAllSchedules = () => {
  const allClasses = getAllClasses().map(c => c.name);
  const data = {};
  for (const className of allClasses) {
    data[className] = loadClassSchedule(className);
  }
  return data;
};

export const saveClassSchedule = (className, schedule) => {
  const key = getScheduleKey(className);
  localStorage.setItem(key, JSON.stringify(schedule));
};

export const updateDaySchedule = (className, dayId, daySchedule) => {
  const current = loadClassSchedule(className);
  const updated = { ...current, [dayId]: { ...current[dayId], ...daySchedule } };
  saveClassSchedule(className, updated);
  return updated;
};

export const updateLesson = (className, dayId, lessonNumber, lessonData) => {
  const daySchedule = loadClassSchedule(className)[dayId] || {};
  const newDay = { ...daySchedule, [lessonNumber]: lessonData || null };
  return updateDaySchedule(className, dayId, newDay);
};

export const getScheduleRows = () => {
  const weekDays = WeekDays.filter(day => !day.isWeekend);
  const lessons = ScheduleTimes.firstShiftLessons;
  const rows = [];
  weekDays.forEach(day => {
    lessons.forEach(lesson => {
      rows.push({
        dayId: day.id,
        dayName: day.name,
        dayShort: day.shortName,
        lessonNumber: lesson.number,
        lessonTime: `${lesson.startTime}–${lesson.endTime}`
      });
    });
  });
  return rows;
};