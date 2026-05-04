const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Функция для определения цвета события
function getEventColor(type, action = '') {
    const colors = {
        // Аутентификация и вход
        'login': '#4caf50',           // зеленый
        'logout': '#ff9800',          // оранжевый
        'auth_error': '#f44336',      // красный
        
        // Действия с расписанием
        'generate': '#2196f3',        // синий
        'edit': '#9c27b0',            // фиолетовый
        'delete': '#f44336',          // красный
        'export': '#00bcd4',          // бирюзовый
        'import': '#009688',          // зеленовато-синий
        
        // CRUD операции
        'create': '#4caf50',          // зеленый
        'update': '#ff9800',          // оранжевый
        'remove': '#f44336',          // красный
        
        // Действия с пользователями
        'user_create': '#2196f3',     // синий
        'user_update': '#ff9800',     // оранжевый
        'user_delete': '#f44336',     // красный
        'user_login': '#4caf50',      // зеленый
        'user_logout': '#ff9800',     // оранжевый
        
        // Действия с данными
        'backup': '#607d8b',          // серо-синий
        'restore': '#9c27b0',         // фиолетовый
        'clear': '#f44336',           // красный
        
        // Ошибки
        'error': '#f44336',           // красный
        'warning': '#ff9800',         // оранжевый
        
        // Системные события
        'system': '#607d8b',          // серо-синий
        'maintenance': '#9c27b0',     // фиолетовый
        
        // Дополнительные
        'view': '#2196f3',            // синий
        'extracurricular': '#9c27b0'  // фиолетовый
    };
    
    // Проверка по точному совпадению типа
    if (colors[type]) {
        return colors[type];
    }
    
    // Проверка по ключевым словам в action
    if (action) {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('вход') || lowerAction.includes('login')) return colors.login;
        if (lowerAction.includes('выход') || lowerAction.includes('logout')) return colors.logout;
        if (lowerAction.includes('генерац') || lowerAction.includes('создан')) return colors.generate;
        if (lowerAction.includes('редактир') || lowerAction.includes('изменен')) return colors.edit;
        if (lowerAction.includes('удал') || lowerAction.includes('удален')) return colors.delete;
        if (lowerAction.includes('экспорт')) return colors.export;
        if (lowerAction.includes('импорт')) return colors.import;
        if (lowerAction.includes('добавл') || lowerAction.includes('создал')) return colors.create;
        if (lowerAction.includes('ошибк')) return colors.error;
    }
    
    // Цвет по умолчанию
    return '#607d8b';
}

// Функция для получения иконки события
function getEventIcon(type, action = '') {
    const icons = {
        'login': '🔓',
        'logout': '🔒',
        'generate': '✨',
        'edit': '✏️',
        'delete': '🗑️',
        'create': '➕',
        'update': '🔄',
        'remove': '❌',
        'export': '💾',
        'import': '📥',
        'backup': '💿',
        'restore': '🔄',
        'error': '⚠️',
        'warning': '⚠️',
        'user_create': '👤',
        'user_update': '👤',
        'user_delete': '👤',
        'clear': '🧹',
        'view': '👁️',
        'system': '⚙️',
        'extracurricular': '🎯'
    };
    
    if (icons[type]) return icons[type];
    
    if (action) {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('вход')) return '🔓';
        if (lowerAction.includes('выход')) return '🔒';
        if (lowerAction.includes('генерац')) return '✨';
        if (lowerAction.includes('редактир')) return '✏️';
        if (lowerAction.includes('удал')) return '🗑️';
        if (lowerAction.includes('экспорт')) return '💾';
        if (lowerAction.includes('импорт')) return '📥';
        if (lowerAction.includes('добавл')) return '➕';
        if (lowerAction.includes('ошибк')) return '⚠️';
    }
    
    return '📋';
}

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
            time: row.created_at,
            color: getEventColor(row.type, row.action),      // Добавляем цвет
            icon: getEventIcon(row.type, row.action)         // Добавляем иконку
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

// Маршрут для статистики
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

// Получить типы событий для фильтрации (с цветами и иконками)
router.get('/types', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT type, COUNT(*) as count 
             FROM activity_log 
             GROUP BY type 
             ORDER BY count DESC`
        );
        
        // Добавляем цвета и иконки для каждого типа
        const typesWithColors = result.rows.map(row => ({
            type: row.type,
            count: parseInt(row.count),
            color: getEventColor(row.type),
            icon: getEventIcon(row.type)
        }));
        
        res.json(typesWithColors);
    } catch (err) {
        console.error('Error getting activity types:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Логирование активности (POST)
router.post('/log', authenticateToken, async (req, res) => {
    try {
        const { type, action, details } = req.body;
        const userId = req.user.id;
        const userName = req.user.username;
        const userRole = req.user.role;
        
        await logActivity(userId, userName, userRole, type, action, details);
        
        res.json({ success: true, message: 'Activity logged successfully' });
    } catch (err) {
        console.error('Error logging activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = { router, logActivity };