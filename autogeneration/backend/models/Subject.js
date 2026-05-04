// models/Subject.js
const db = require('../config/database');

class Subject {
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, name, color FROM subjects ORDER BY name'
    );
    return rows;
  }

  static async getColorByName(name) {
    const [rows] = await db.query(
      'SELECT color FROM subjects WHERE name = ?',
      [name]
    );
    return rows[0]?.color || '#9E9E9E';
  }
}

module.exports = Subject;