import { timeToMinutes, minutesToTime } from '../utils/timeUtils';

export function generateSchedule(data, settings) {
  const classes = data.Classes;
  const subjects = data.Subjects;
  const teachers = data.Teachers;

  const schedule = {};

  for (const cls of classes) {
    schedule[cls.Name] = generateClassSchedule(
      cls,
      subjects,
      teachers,
      settings
    );
  }

  return schedule;
}

function generateClassSchedule(cls, subjects, teachers, settings) {
  const days = settings.workWeek.days;
  const maxLessons = settings.schedule.maxLessonsPerDay;

  const result = {};

  for (const day of days) {
    result[day] = [];
    let currentTime = timeToMinutes(settings.schedule.startTime);

    const priority = subjects.filter(s =>
      settings.rules.prioritySubjects.includes(s.Name)
    );
    const others = subjects.filter(
      s => !settings.rules.prioritySubjects.includes(s.Name)
    );

    const daySubjects = [...priority, ...others].slice(0, maxLessons);

    daySubjects.forEach((subject, index) => {
      const lessonStart = minutesToTime(currentTime);
      currentTime += settings.schedule.lessonDuration;
      const lessonEnd = minutesToTime(currentTime);

      result[day].push({
        subject: subject.Name,
        teacher: findTeacher(subject, teachers),
        start: lessonStart,
        end: lessonEnd
      });

      // перемена
      if (index + 1 === settings.schedule.breaks.afterLesson) {
        currentTime += settings.schedule.breaks.long;
      } else {
        currentTime += settings.schedule.breaks.short;
      }
    });
  }

  return result;
}

function findTeacher(subject, teachers) {
  const teacher = teachers.find(t =>
    t.Subjects?.split(',').includes(subject.Name)
  );
  return teacher ? teacher.Name : '—';
}
