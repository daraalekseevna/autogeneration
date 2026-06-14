// models/Teacher.js
const db = require('../config/database');

class Teacher {
  static async getAll() {
    const [rows] = await db.query(`
      SELECT t.id, t.name, GROUP_CONCAT(s.name SEPARATOR ', ') as subjects
      FROM teachers t
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      GROUP BY t.id
      ORDER BY t.name
    `);
    return rows;
  }

  static async getSubjectsByTeacher(teacherName) {
    const [rows] = await db.query(`
      SELECT s.id, s.name, s.color
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      JOIN teachers t ON ts.teacher_id = t.id
      WHERE t.name = ?
    `, [teacherName]);
    return rows;
  }
}

module.exports = Teacher;