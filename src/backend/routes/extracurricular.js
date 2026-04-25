const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Получить все дополнительные занятия (с фильтрацией)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { teacher, day, search } = req.query;
        
        let query = `
            SELECT ea.*, 
                   t.first_name, t.last_name, t.middle_name
            FROM extracurricular_activities ea
            LEFT JOIN teachers t ON ea.teacher_id = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (teacher) {
            query += ` AND ea.teacher_name ILIKE $${paramIndex}`;
            params.push(`%${teacher}%`);
            paramIndex++;
        }
        
        if (day) {
            query += ` AND $${paramIndex} = ANY(ea.days)`;
            params.push(day);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (ea.title ILIKE $${paramIndex} OR ea.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` ORDER BY ea.days, ea.start_time`;
        
        const result = await db.query(query, params);
        
        const activities = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            teacher: row.teacher_name || `${row.last_name} ${row.first_name}`.trim(),
            teacherId: row.teacher_id,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description,
            color: row.color
        }));
        
        res.json(activities);
        
    } catch (err) {
        console.error('Error getting activities:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить занятие по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ea.*, t.first_name, t.last_name, t.middle_name
             FROM extracurricular_activities ea
             LEFT JOIN teachers t ON ea.teacher_id = t.id
             WHERE ea.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        const row = result.rows[0];
        res.json({
            id: row.id,
            title: row.title,
            teacher: row.teacher_name || `${row.last_name} ${row.first_name}`.trim(),
            teacherId: row.teacher_id,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description,
            color: row.color
        });
        
    } catch (err) {
        console.error('Error getting activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новое занятие (только для админов)
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    try {
        const { title, teacher, teacherId, days, startTime, endTime, room, description, color } = req.body;
        
        let actualTeacherId = teacherId;
        let teacherName = teacher;
        
        if (!actualTeacherId && teacher) {
            const teacherResult = await db.query(
                `SELECT id, first_name, last_name, middle_name 
                 FROM teachers 
                 WHERE first_name ILIKE $1 OR last_name ILIKE $1`,
                [`%${teacher.split(' ')[0]}%`]
            );
            if (teacherResult.rows.length > 0) {
                actualTeacherId = teacherResult.rows[0].id;
                teacherName = `${teacherResult.rows[0].last_name} ${teacherResult.rows[0].first_name}`.trim();
            }
        }
        
        const result = await db.query(
            `INSERT INTO extracurricular_activities 
             (title, teacher_id, teacher_name, days, start_time, end_time, room, description, color)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [title, actualTeacherId, teacherName, days, startTime, endTime, room, description, color || '#2196F3']
        );
        
        const row = result.rows[0];
        res.json({
            id: row.id,
            title: row.title,
            teacher: row.teacher_name,
            teacherId: row.teacher_id,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description,
            color: row.color
        });
        
    } catch (err) {
        console.error('Error creating activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить занятие (только для админов)
router.put('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    try {
        const { title, teacher, teacherId, days, startTime, endTime, room, description, color } = req.body;
        
        let actualTeacherId = teacherId;
        let teacherName = teacher;
        
        if (!actualTeacherId && teacher) {
            const teacherResult = await db.query(
                `SELECT id, first_name, last_name, middle_name 
                 FROM teachers 
                 WHERE first_name ILIKE $1 OR last_name ILIKE $1`,
                [`%${teacher.split(' ')[0]}%`]
            );
            if (teacherResult.rows.length > 0) {
                actualTeacherId = teacherResult.rows[0].id;
                teacherName = `${teacherResult.rows[0].last_name} ${teacherResult.rows[0].first_name}`.trim();
            }
        }
        
        const result = await db.query(
            `UPDATE extracurricular_activities 
             SET title = $1, teacher_id = $2, teacher_name = $3, days = $4, 
                 start_time = $5, end_time = $6, room = $7, description = $8, color = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
             RETURNING *`,
            [title, actualTeacherId, teacherName, days, startTime, endTime, room, description, color, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        const row = result.rows[0];
        res.json({
            id: row.id,
            title: row.title,
            teacher: row.teacher_name,
            teacherId: row.teacher_id,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description,
            color: row.color
        });
        
    } catch (err) {
        console.error('Error updating activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить занятие (только для админов)
router.delete('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    try {
        const result = await db.query(
            'DELETE FROM extracurricular_activities WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        res.json({ message: 'Занятие удалено' });
        
    } catch (err) {
        console.error('Error deleting activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;