// models/LessonSchedule.js
const db = require('../config/database');

class LessonSchedule {
  static async getScheduleByClass(className, dayOfWeek, lessonNumber) {
    const [rows] = await db.query(`
      SELECT ls.*, 
             s.name as subject_name, s.color as subject_color,
             t.name as teacher_name,
             c.name as class_name
      FROM lesson_schedule ls
      JOIN subjects s ON ls.subject_id = s.id
      JOIN teachers t ON ls.teacher_id = t.id
      JOIN classes c ON ls.class_id = c.id
      WHERE c.name = ? AND ls.day_of_week = ? AND ls.lesson_number = ?
    `, [className, dayOfWeek, lessonNumber]);
    return rows[0];
  }

  static async getAllSchedules() {
    const [rows] = await db.query(`
      SELECT ls.id, ls.class_id, ls.subject_id, ls.teacher_id, 
             ls.day_of_week, ls.lesson_number, ls.room,
             c.name as class_name,
             s.name as subject_name, s.color as subject_color,
             t.name as teacher_name
      FROM lesson_schedule ls
      JOIN classes c ON ls.class_id = c.id
      JOIN subjects s ON ls.subject_id = s.id
      JOIN teachers t ON ls.teacher_id = t.id
      ORDER BY c.name, FIELD(ls.day_of_week, 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'), ls.lesson_number
    `);
    return rows;
  }

  static async getFullScheduleByClass(className) {
    const [rows] = await db.query(`
      SELECT ls.id, ls.day_of_week, ls.lesson_number, ls.room,
             s.name as subject_name, s.color as subject_color,
             t.name as teacher_name
      FROM lesson_schedule ls
      JOIN classes c ON ls.class_id = c.id
      JOIN subjects s ON ls.subject_id = s.id
      JOIN teachers t ON ls.teacher_id = t.id
      WHERE c.name = ?
      ORDER BY FIELD(ls.day_of_week, 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'), ls.lesson_number
    `, [className]);
    
    // Преобразуем в удобный формат
    const schedule = {};
    const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    
    days.forEach(day => {
      schedule[day] = {};
      for (let i = 1; i <= 7; i++) {
        const lesson = rows.find(r => r.day_of_week === day && r.lesson_number === i);
        if (lesson) {
          schedule[day][i] = {
            subject: lesson.subject_name,
            teacher: lesson.teacher_name,
            room: lesson.room,
            color: lesson.subject_color
          };
        }
      }
    });
    
    return schedule;
  }

  static async updateLesson(className, dayOfWeek, lessonNumber, lessonData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Получаем class_id
      const [classRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [className]
      );
      const classId = classRow[0]?.id;
      
      if (!classId) {
        throw new Error('Класс не найден');
      }
      
      // Получаем subject_id
      const [subjectRow] = await connection.query(
        'SELECT id FROM subjects WHERE name = ?',
        [lessonData.subject]
      );
      const subjectId = subjectRow[0]?.id;
      
      if (!subjectId) {
        throw new Error('Предмет не найден');
      }
      
      // Получаем teacher_id
      const [teacherRow] = await connection.query(
        'SELECT id FROM teachers WHERE name = ?',
        [lessonData.teacher]
      );
      const teacherId = teacherRow[0]?.id;
      
      if (!teacherId) {
        throw new Error('Учитель не найден');
      }
      
      // Проверяем, существует ли уже урок
      const [existing] = await connection.query(
        'SELECT id FROM lesson_schedule WHERE class_id = ? AND day_of_week = ? AND lesson_number = ?',
        [classId, dayOfWeek, lessonNumber]
      );
      
      if (existing.length > 0) {
        // Обновляем существующий
        await connection.query(
          `UPDATE lesson_schedule 
           SET subject_id = ?, teacher_id = ?, room = ?
           WHERE class_id = ? AND day_of_week = ? AND lesson_number = ?`,
          [subjectId, teacherId, lessonData.room, classId, dayOfWeek, lessonNumber]
        );
      } else {
        // Создаем новый
        await connection.query(
          `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [classId, subjectId, teacherId, dayOfWeek, lessonNumber, lessonData.room]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteLesson(className, dayOfWeek, lessonNumber) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [classRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [className]
      );
      const classId = classRow[0]?.id;
      
      if (!classId) {
        throw new Error('Класс не найден');
      }
      
      await connection.query(
        'DELETE FROM lesson_schedule WHERE class_id = ? AND day_of_week = ? AND lesson_number = ?',
        [classId, dayOfWeek, lessonNumber]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async clearClassDay(className, dayOfWeek) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [classRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [className]
      );
      const classId = classRow[0]?.id;
      
      if (!classId) {
        throw new Error('Класс не найден');
      }
      
      await connection.query(
        'DELETE FROM lesson_schedule WHERE class_id = ? AND day_of_week = ?',
        [classId, dayOfWeek]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async copyDay(sourceClass, targetClass, dayOfWeek) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [sourceClassRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [sourceClass]
      );
      const sourceClassId = sourceClassRow[0]?.id;
      
      const [targetClassRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [targetClass]
      );
      const targetClassId = targetClassRow[0]?.id;
      
      if (!sourceClassId || !targetClassId) {
        throw new Error('Класс не найден');
      }
      
      // Получаем уроки исходного класса
      const [sourceLessons] = await connection.query(
        'SELECT subject_id, teacher_id, lesson_number, room FROM lesson_schedule WHERE class_id = ? AND day_of_week = ?',
        [sourceClassId, dayOfWeek]
      );
      
      // Удаляем старые уроки целевого класса
      await connection.query(
        'DELETE FROM lesson_schedule WHERE class_id = ? AND day_of_week = ?',
        [targetClassId, dayOfWeek]
      );
      
      // Вставляем новые
      for (const lesson of sourceLessons) {
        await connection.query(
          `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [targetClassId, lesson.subject_id, lesson.teacher_id, dayOfWeek, lesson.lesson_number, lesson.room]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async checkConflicts(className, dayOfWeek, lessonNumber, subjectId, teacherId, room) {
    const connection = await db.getConnection();
    
    try {
      const [classRow] = await connection.query(
        'SELECT id FROM classes WHERE name = ?',
        [className]
      );
      const currentClassId = classRow[0]?.id;
      
      // Проверка по кабинету
      const [roomConflicts] = await connection.query(`
        SELECT c.name as class_name
        FROM lesson_schedule ls
        JOIN classes c ON ls.class_id = c.id
        WHERE ls.day_of_week = ? AND ls.lesson_number = ? AND ls.room = ? AND c.id != ?
      `, [dayOfWeek, lessonNumber, room, currentClassId]);
      
      // Проверка по учителю
      const [teacherConflicts] = await connection.query(`
        SELECT c.name as class_name
        FROM lesson_schedule ls
        JOIN classes c ON ls.class_id = c.id
        WHERE ls.day_of_week = ? AND ls.lesson_number = ? AND ls.teacher_id = ? AND c.id != ?
      `, [dayOfWeek, lessonNumber, teacherId, currentClassId]);
      
      return {
        roomConflicts: roomConflicts.map(c => c.class_name),
        teacherConflicts: teacherConflicts.map(c => c.class_name)
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = LessonSchedule;