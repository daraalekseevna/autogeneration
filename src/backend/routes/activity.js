const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

async function logActivity(userId, userName, userRole, type, action, details = null) {
    try {
        await db.query(
            `INSERT INTO activity_log (user_id, user_name, user_role, type, action, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, userName, userRole, type, action, details]
        );
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// Получить журнал событий (с фильтрацией)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT al.id, al.user_name, al.user_role, al.type, al.action, al.details, al.created_at
            FROM activity_log al
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (type && type !== 'all') {
            query += ` AND al.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        
        query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        const countResult = await db.query('SELECT COUNT(*) as total FROM activity_log');
        
        const activities = result.rows.map(row => ({
            id: row.id,
            user: row.user_name || 'Система',
            userRole: row.user_role,
            type: row.type,
            text: row.action,
            details: row.details,
            time: row.created_at
        }));
        
        res.json({
            activities,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (err) {
        console.error('Error getting activity log:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ДОБАВЛЕН МАРШРУТ /stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Получаем статистику по классам
        const classesResult = await db.query('SELECT COUNT(*) as count FROM classes');
        
        // Получаем статистику по учителям
        const teachersResult = await db.query('SELECT COUNT(*) as count FROM teachers');
        
        // Получаем статистику по урокам
        const lessonsResult = await db.query('SELECT COUNT(*) as count FROM lesson_schedule');
        
        // Получаем количество событий за сегодня
        const todayEvents = await db.query(
            `SELECT COUNT(*) as count FROM activity_log 
             WHERE DATE(created_at) = CURRENT_DATE`
        );
        
        // Получаем информацию о последней генерации
        const lastGeneration = await db.query(
            `SELECT created_at FROM activity_log 
             WHERE type = 'generate' 
             ORDER BY created_at DESC 
             LIMIT 1`
        );
        
        res.json({
            totalClasses: parseInt(classesResult.rows[0].count) || 0,
            teachersCount: parseInt(teachersResult.rows[0].count) || 0,
            scheduledLessons: parseInt(lessonsResult.rows[0].count) || 0,
            todayEvents: parseInt(todayEvents.rows[0].count) || 0,
            lastGenerationDate: lastGeneration.rows[0]?.created_at || null
        });
        
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить типы событий для фильтрации
router.get('/types', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT type, COUNT(*) as count 
             FROM activity_log 
             GROUP BY type 
             ORDER BY count DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting activity types:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = { router, logActivity };