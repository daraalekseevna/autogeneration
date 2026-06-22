// routes/extracurricular.js
const express = require('express');
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ТАБЛИЦЫ ==========
async function ensureTablesExist() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS extended_teachers (
                id SERIAL PRIMARY KEY,
                last_name VARCHAR(100) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                section_name VARCHAR(255) NOT NULL,
                section_color VARCHAR(7) DEFAULT '#ff6b6b',
                school_teacher_id INTEGER NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS extracurricular_activities (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                teacher_id INTEGER,
                section_id INTEGER,
                section_name VARCHAR(255),
                teacher_name VARCHAR(255),
                color VARCHAR(7) DEFAULT '#21435A',
                days TEXT[] DEFAULT '{}',
                start_time TIME,
                end_time TIME,
                room VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        try {
            await db.query(`
                ALTER TABLE extracurricular_activities 
                DROP CONSTRAINT IF EXISTS extracurricular_activities_teacher_id_fkey
            `);
            console.log('Foreign key constraint dropped');
        } catch (err) {
            console.log('No foreign key constraint to drop');
        }
        
        console.log('Tables ensured');
    } catch (err) {
        console.error('Error ensuring tables:', err);
    }
}

// ========== ПОЛУЧИТЬ СПИСОК ПЕДАГОГОВ ДОП. ОБРАЗОВАНИЯ ==========
// ✅ Добавляем authorizeRoles
router.get('/extended-teachers', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        console.log('=== GET /extended-teachers ===');
        console.log('User:', req.user);
        
        await ensureTablesExist();
        
        const result = await db.query(`
            SELECT 
                et.id,
                et.last_name,
                et.first_name,
                et.middle_name,
                et.section_name,
                et.section_color,
                et.school_teacher_id,
                CONCAT(et.last_name, ' ', et.first_name, ' ', COALESCE(et.middle_name, '')) as name,
                COALESCE(et.section_color, '#21435A') as color
            FROM extended_teachers et
            ORDER BY et.last_name, et.first_name
        `);
        
        console.log(`Found ${result.rows.length} extended teachers`);
        
        const teachersMap = new Map();
        
        result.rows.forEach(row => {
            if (!teachersMap.has(row.id)) {
                teachersMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    middleName: row.middle_name || '',
                    color: row.color,
                    sections: []
                });
            }
            
            if (row.section_name) {
                teachersMap.get(row.id).sections.push({
                    id: row.id,
                    section_name: row.section_name,
                    section_color: row.section_color || row.color
                });
            }
        });
        
        const teachers = Array.from(teachersMap.values());
        res.json(teachers);
        
    } catch (err) {
        console.error('Error getting extended teachers:', err);
        res.status(500).json({ message: 'Ошибка получения списка педагогов', error: err.message });
    }
});

// ========== ПОЛУЧИТЬ ВСЕХ ПЕДАГОГОВ ==========
// ✅ Добавляем authorizeRoles
router.get('/teachers', authenticateToken, authorizeRoles('admin', 'superadmin', 'teacher'), async (req, res) => {
    try {
        console.log('=== GET /extracurricular/teachers ===');
        console.log('User:', req.user);
        
        await ensureTablesExist();
        
        const result = await db.query(`
            SELECT 
                et.id,
                et.last_name,
                et.first_name,
                et.middle_name,
                et.section_name,
                et.section_color,
                et.school_teacher_id,
                CONCAT(et.last_name, ' ', et.first_name, ' ', COALESCE(et.middle_name, '')) as name,
                COALESCE(et.section_color, '#21435A') as color
            FROM extended_teachers et
            ORDER BY et.last_name, et.first_name
        `);
        
        const teachersMap = new Map();
        
        result.rows.forEach(row => {
            if (!teachersMap.has(row.id)) {
                teachersMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    middleName: row.middle_name || '',
                    color: row.color,
                    sections: []
                });
            }
            
            if (row.section_name) {
                teachersMap.get(row.id).sections.push({
                    id: row.id,
                    section_name: row.section_name,
                    section_color: row.section_color || row.color
                });
            }
        });
        
        const teachers = Array.from(teachersMap.values());
        res.json(teachers);
        
    } catch (err) {
        console.error('Error getting teachers:', err);
        res.status(500).json({ message: 'Ошибка получения педагогов', error: err.message });
    }
});

// ========== ПОЛУЧИТЬ ВСЕ ЗАНЯТИЯ ==========
// ✅ Добавляем authorizeRoles
router.get('/', authenticateToken, authorizeRoles('admin', 'superadmin', 'teacher'), async (req, res) => {
    try {
        console.log('=== GET /extracurricular ===');
        console.log('User:', req.user);
        
        await ensureTablesExist();
        
        const result = await db.query(`
            SELECT 
                ea.id,
                ea.title,
                ea.teacher_id,
                ea.section_id,
                ea.section_name,
                ea.teacher_name,
                ea.color,
                ea.days,
                ea.start_time,
                ea.end_time,
                ea.room,
                ea.description
            FROM extracurricular_activities ea
            ORDER BY ea.days, ea.start_time
        `);
        
        const activities = result.rows.map(row => ({
            id: row.id,
            title: row.section_name || row.title || 'Без названия',
            sectionName: row.section_name || row.title || 'Без названия',
            teacherId: row.teacher_id,
            teacherName: row.teacher_name || 'Преподаватель',
            sectionId: row.section_id,
            teacherColor: row.color || '#21435A',
            days: row.days || [],
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room || '',
            description: row.description || ''
        }));
        
        res.json(activities);
        
    } catch (err) {
        console.error('Error getting activities:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// ========== ПОЛУЧИТЬ ОДНО ЗАНЯТИЕ ==========
router.get('/:id', authenticateToken, authorizeRoles('admin', 'superadmin', 'teacher'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Неверный ID' });
        }
        
        const result = await db.query(
            `SELECT * FROM extracurricular_activities WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        const row = result.rows[0];
        res.json({
            id: row.id,
            title: row.section_name || row.title || 'Без названия',
            sectionName: row.section_name || row.title || 'Без названия',
            teacherId: row.teacher_id,
            teacherName: row.teacher_name || 'Преподаватель',
            sectionId: row.section_id,
            teacherColor: row.color || '#21435A',
            days: row.days || [],
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room || '',
            description: row.description || ''
        });
        
    } catch (err) {
        console.error('Error getting activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== СОЗДАТЬ НОВОЕ ЗАНЯТИЕ ==========
// ✅ Добавляем authorizeRoles
router.post('/', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        console.log('=== POST /extracurricular ===');
        console.log('User:', req.user);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        await ensureTablesExist();
        
        const { 
            teacherId, 
            sectionId, 
            sectionName, 
            teacherName, 
            teacherColor,
            days, 
            startTime, 
            endTime, 
            room, 
            description 
        } = req.body;
        
        if (!teacherId || !sectionId || !sectionName || !days || days.length === 0 || !startTime || !endTime || !room) {
            return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
        }
        
        const formattedStartTime = startTime.includes(':') ? startTime : `${startTime}:00`;
        const formattedEndTime = endTime.includes(':') ? endTime : `${endTime}:00`;
        
        const result = await db.query(
            `INSERT INTO extracurricular_activities 
             (teacher_id, section_id, section_name, teacher_name, color, days, start_time, end_time, room, description, title)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [teacherId, sectionId, sectionName, teacherName || '', teacherColor || '#21435A', days, formattedStartTime, formattedEndTime, room, description || '', sectionName]
        );
        
        const row = result.rows[0];
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'extracurricular',
            `Создано дополнительное занятие: ${sectionName}`,
            null
        );
        
        res.status(201).json({
            id: row.id,
            title: row.section_name || row.title,
            sectionName: row.section_name || row.title,
            teacherId: row.teacher_id,
            teacherName: row.teacher_name || teacherName,
            sectionId: row.section_id,
            teacherColor: row.color,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description
        });
        
    } catch (err) {
        console.error('Error creating activity:', err);
        res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
});

// ========== ОБНОВИТЬ ЗАНЯТИЕ ==========
// ✅ Добавляем authorizeRoles
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Неверный ID' });
        }
        
        const { 
            teacherId, 
            sectionId, 
            sectionName, 
            teacherName, 
            teacherColor,
            days, 
            startTime, 
            endTime, 
            room, 
            description 
        } = req.body;
        
        if (!teacherId || !sectionId || !sectionName || !days || days.length === 0 || !startTime || !endTime || !room) {
            return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
        }
        
        const formattedStartTime = startTime.includes(':') ? startTime : `${startTime}:00`;
        const formattedEndTime = endTime.includes(':') ? endTime : `${endTime}:00`;
        
        const result = await db.query(
            `UPDATE extracurricular_activities 
             SET teacher_id = $1, 
                 section_id = $2, 
                 section_name = $3, 
                 teacher_name = $4, 
                 color = $5, 
                 days = $6, 
                 start_time = $7, 
                 end_time = $8, 
                 room = $9, 
                 description = $10,
                 title = $11,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING *`,
            [teacherId, sectionId, sectionName, teacherName || '', teacherColor || '#21435A', days, formattedStartTime, formattedEndTime, room, description || '', sectionName, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        const row = result.rows[0];
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'edit',
            `Обновлено дополнительное занятие: ${sectionName}`,
            null
        );
        
        res.json({
            id: row.id,
            title: row.section_name || row.title,
            sectionName: row.section_name || row.title,
            teacherId: row.teacher_id,
            teacherName: row.teacher_name || teacherName,
            sectionId: row.section_id,
            teacherColor: row.color,
            days: row.days,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            description: row.description
        });
        
    } catch (err) {
        console.error('Error updating activity:', err);
        res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
});

// ========== УДАЛИТЬ ЗАНЯТИЕ ==========
// ✅ Добавляем authorizeRoles
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Неверный ID' });
        }
        
        const activity = await db.query(
            'SELECT section_name FROM extracurricular_activities WHERE id = $1',
            [id]
        );
        const title = activity.rows[0]?.section_name || 'неизвестно';
        
        const result = await db.query(
            'DELETE FROM extracurricular_activities WHERE id = $1 RETURNING id',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Занятие не найдено' });
        }
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Удалено дополнительное занятие: ${title}`,
            null
        );
        
        res.json({ message: 'Занятие удалено' });
        
    } catch (err) {
        console.error('Error deleting activity:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;