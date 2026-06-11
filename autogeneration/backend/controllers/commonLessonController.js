// backend/controllers/commonLessonController.js
const db = require('../models/database');

class CommonLessonController {
    // Получить все общие уроки
    static async getAll(req, res) {
        try {
            const [rows] = await db.query(`
                SELECT id, name, day_of_week as day, time_start, time_end, color, description, is_active
                FROM common_lessons 
                ORDER BY FIELD(day_of_week, 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ')
            `);
            
            const lessons = rows.map(row => ({
                id: row.id,
                name: row.name,
                day: row.day,
                time: `${row.time_start}-${row.time_end}`,
                color: row.color,
                description: row.description,
                isActive: row.is_active === 1
            }));
            
            res.json(lessons);
        } catch (error) {
            console.error('Error getting common lessons:', error);
            res.status(500).json({ message: 'Ошибка получения общих уроков' });
        }
    }

    // Получить общий урок по дню недели
    static async getByDay(req, res) {
        const { day } = req.params;
        
        try {
            const [rows] = await db.query(`
                SELECT id, name, day_of_week as day, time_start, time_end, color, description, is_active
                FROM common_lessons 
                WHERE day_of_week = ? AND is_active = true
            `, [day]);
            
            if (rows.length === 0) {
                return res.json(null);
            }
            
            const row = rows[0];
            res.json({
                id: row.id,
                name: row.name,
                day: row.day,
                time: `${row.time_start}-${row.time_end}`,
                color: row.color,
                description: row.description,
                isActive: row.is_active === 1
            });
        } catch (error) {
            console.error('Error getting common lesson by day:', error);
            res.status(500).json({ message: 'Ошибка получения урока' });
        }
    }

    // Добавить общий урок
    static async create(req, res) {
        const { name, day, time, color, description } = req.body;
        
        if (!name || !day) {
            return res.status(400).json({ message: 'Название и день недели обязательны' });
        }
        
        const [timeStart, timeEnd] = time ? time.split('-') : ['08:00', '08:15'];
        
        try {
            const [result] = await db.query(`
                INSERT INTO common_lessons (name, day_of_week, time_start, time_end, color, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [name, day, timeStart, timeEnd, color || '#ef4444', description || null]);
            
            res.status(201).json({ 
                id: result.insertId,
                message: 'Общий урок добавлен'
            });
        } catch (error) {
            console.error('Error creating common lesson:', error);
            res.status(500).json({ message: 'Ошибка добавления урока' });
        }
    }

    // Обновить общий урок
    static async update(req, res) {
        const { id } = req.params;
        const { name, day, time, color, description, isActive } = req.body;
        
        const [timeStart, timeEnd] = time ? time.split('-') : ['08:00', '08:15'];
        
        try {
            await db.query(`
                UPDATE common_lessons 
                SET name = ?, 
                    day_of_week = ?, 
                    time_start = ?, 
                    time_end = ?, 
                    color = ?, 
                    description = ?,
                    is_active = ?
                WHERE id = ?
            `, [name, day, timeStart, timeEnd, color || '#ef4444', description || null, isActive !== false ? 1 : 0, id]);
            
            res.json({ message: 'Общий урок обновлен' });
        } catch (error) {
            console.error('Error updating common lesson:', error);
            res.status(500).json({ message: 'Ошибка обновления урока' });
        }
    }

    // Удалить общий урок
    static async delete(req, res) {
        const { id } = req.params;
        
        try {
            await db.query('DELETE FROM common_lessons WHERE id = ?', [id]);
            res.json({ message: 'Общий урок удален' });
        } catch (error) {
            console.error('Error deleting common lesson:', error);
            res.status(500).json({ message: 'Ошибка удаления урока' });
        }
    }
}

module.exports = CommonLessonController;