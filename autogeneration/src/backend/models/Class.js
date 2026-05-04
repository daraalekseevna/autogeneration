// models/Class.js
const db = require('../config/database');

class Class {
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, name, grade_number, grade_letter, shift FROM classes ORDER BY grade_number, grade_letter'
    );
    return rows;
  }

  static async getByName(name) {
    const [rows] = await db.query(
      'SELECT id, name, grade_number, grade_letter, shift FROM classes WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  static async getClassesByShift(shift) {
    const [rows] = await db.query(
      'SELECT id, name, grade_number, grade_letter FROM classes WHERE shift = ? ORDER BY grade_number, grade_letter',
      [shift]
    );
    return rows;
  }

  static async getShiftByClassName(className) {
    const [rows] = await db.query(
      'SELECT shift FROM classes WHERE name = ?',
      [className]
    );
    return rows[0]?.shift || 1;
  }
}

module.exports = Class;