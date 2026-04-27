const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM schedule_settings WHERE id = 1');
        
        if (result.rows.length === 0) {
            await db.query('INSERT INTO schedule_settings (id) VALUES (1)');
            const newResult = await db.query('SELECT * FROM schedule_settings WHERE id = 1');
            return res.json(newResult.rows[0]);
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error getting settings:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/settings', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    try {
        const {
            startTime,
            lessonDuration,
            maxLessonsPerDay,
            shortBreakDuration,
            breaks,
            workDays,
            saturdayLessons,
            secondShift,
            secondShiftStart,
            secondShiftClasses,
            allowEmptyLessons,
            balanceLoad
        } = req.body;
        
        await db.query(
            `UPDATE schedule_settings SET 
                start_time = $1,
                lesson_duration = $2,
                max_lessons_per_day = $3,
                short_break_duration = $4,
                breaks = $5,
                work_days = $6,
                saturday_lessons = $7,
                second_shift = $8,
                second_shift_start = $9,
                second_shift_classes = $10,
                allow_empty_lessons = $11,
                balance_load = $12,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`,
            [
                startTime,
                lessonDuration,
                maxLessonsPerDay,
                shortBreakDuration,
                JSON.stringify(breaks),
                workDays,
                saturdayLessons,
                secondShift,
                secondShiftStart,
                secondShiftClasses,
                allowEmptyLessons,
                balanceLoad
            ]
        );
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'edit',
            `Обновлены настройки генерации расписания`,
            null
        );
        
        res.json({ message: 'Настройки сохранены' });
    } catch (err) {
        console.error('Error saving settings:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/generate', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    try {
        const settingsResult = await db.query('SELECT * FROM schedule_settings WHERE id = 1');
        const settings = settingsResult.rows[0];
        
        const classesResult = await db.query('SELECT id, number, letter FROM classes');
        const classes = classesResult.rows;
        
        const subjectsResult = await db.query('SELECT id, name FROM subjects');
        
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
        if (settings.saturday_lessons) {
            weekDays.push('Сб');
        }
        
        const dayMap = {
            'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6
        };
        
        await db.query('DELETE FROM lesson_schedule');
        
        let totalLessons = 0;
        
        for (const classItem of classes) {
            const className = `${classItem.number}${classItem.letter}`;
            const isSecondShift = settings.second_shift && 
                settings.second_shift_classes.includes(className);
            
            const maxLessons = isSecondShift ? 
                Math.min(settings.max_lessons_per_day, 6) : 
                settings.max_lessons_per_day;
            
            for (const day of weekDays) {
                const dayNum = dayMap[day];
                
                for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
                    const randomSubject = subjectsResult.rows[
                        Math.floor(Math.random() * subjectsResult.rows.length)
                    ];
                    
                    const randomTeacher = await db.query(`
                        SELECT id FROM teachers 
                        ORDER BY RANDOM() 
                        LIMIT 1
                    `);
                    
                    const room = `${Math.floor(Math.random() * 300) + 100}`;
                    
                    await db.query(
                        `INSERT INTO lesson_schedule 
                         (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [classItem.id, randomSubject.id, randomTeacher.rows[0]?.id || null, dayNum, lessonNum, room]
                    );
                    totalLessons++;
                }
            }
        }
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'generate',
            `Запущена генерация расписания`,
            null
        );
        
        res.json({
            message: 'Расписание успешно сгенерировано',
            stats: {
                classes: classes.length,
                totalLessons: totalLessons,
                days: weekDays.length
            }
        });
        
    } catch (err) {
        console.error('Error generating schedule:', err);
        res.status(500).json({ message: 'Ошибка при генерации расписания' });
    }
});

module.exports = router;