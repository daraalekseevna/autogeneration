// routes/schedule.js
const express = require('express');
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// Константы
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

// Вспомогательная функция для получения ID класса по имени
async function getClassIdByName(className) {
    const number = parseInt(className.match(/\d+/)?.[0] || '1');
    const letter = className.match(/[А-Я]+/)?.[0] || 'А';
    
    const result = await db.query(
        'SELECT id FROM classes WHERE number = $1 AND letter = $2',
        [number, letter]
    );
    return result.rows[0]?.id;
}

// Вспомогательная функция для получения ID предмета по имени
async function getSubjectIdByName(subjectName) {
    const result = await db.query(
        'SELECT id FROM subjects WHERE name = $1',
        [subjectName]
    );
    return result.rows[0]?.id;
}

// Вспомогательная функция для получения ID учителя по имени
async function getTeacherIdByName(teacherName) {
    const result = await db.query(
        'SELECT id FROM teachers WHERE name = $1',
        [teacherName]
    );
    return result.rows[0]?.id;
}

// ========== НАСТРОЙКИ ==========
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

// ========== ГЕНЕРАЦИЯ ==========
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

// ========== ПОЛУЧЕНИЕ КЛАССОВ ДЛЯ SCHEDULEVIEWER ==========
// Получить все классы из БД для ScheduleViewer
router.get('/viewer/classes', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id,
                CONCAT(number, letter) as name,
                number,
                letter,
                shift
            FROM classes 
            ORDER BY number, letter
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching viewer classes:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== ПОЛУЧЕНИЕ РАСПИСАНИЯ ==========

// Получить все классы
router.get('/classes', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, CONCAT(number, letter) as name, number, letter, shift FROM classes ORDER BY number, letter'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить всех учителей
router.get('/teachers', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.id, COALESCE(t.name, t.last_name || ' ' || t.first_name) as name, array_agg(s.name) as subjects
            FROM teachers t
            LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            GROUP BY t.id
            ORDER BY t.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить все предметы
router.get('/subjects', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, color FROM subjects ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить полное расписание для всех классов (из БД, по реальным классам)
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const schedules = {};
        
        // Получаем реальные классы из БД
        const classesResult = await db.query(
            'SELECT id, CONCAT(number, letter) as name, number, letter FROM classes ORDER BY number, letter'
        );
        const dbClasses = classesResult.rows;
        
        for (const classItem of dbClasses) {
            const className = classItem.name;
            const classId = classItem.id;
            
            const lessonsResult = await db.query(`
                SELECT ls.day_of_week, ls.lesson_number, ls.room,
                       s.name as subject_name, s.color as subject_color,
                       COALESCE(t.name, t.last_name || ' ' || t.first_name) as teacher_name
                FROM lesson_schedule ls
                JOIN subjects s ON ls.subject_id = s.id
                JOIN teachers t ON ls.teacher_id = t.id
                WHERE ls.class_id = $1
                ORDER BY ls.day_of_week, ls.lesson_number
            `, [classId]);
            
            const schedule = {};
            DAYS_RU.forEach(day => { schedule[day] = {}; });
            
            lessonsResult.rows.forEach(lesson => {
                const dayIndex = lesson.day_of_week - 1;
                const dayName = DAYS_RU[dayIndex];
                if (dayName) {
                    schedule[dayName][lesson.lesson_number] = {
                        subject: lesson.subject_name,
                        teacher: lesson.teacher_name,
                        room: lesson.room,
                        color: lesson.subject_color
                    };
                }
            });
            
            schedules[className] = schedule;
        }
        
        res.json({ schedules });
    } catch (err) {
        console.error('Error fetching all schedules:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить расписание для конкретного класса
router.get('/class/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        const number = parseInt(className.match(/\d+/)?.[0] || '1');
        const letter = className.match(/[А-Я]+/)?.[0] || 'А';
        
        const classResult = await db.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [number, letter]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const classId = classResult.rows[0].id;
        
        const lessonsResult = await db.query(`
            SELECT ls.day_of_week, ls.lesson_number, ls.room,
                   s.name as subject_name, s.color as subject_color,
                   COALESCE(t.name, t.last_name || ' ' || t.first_name) as teacher_name
            FROM lesson_schedule ls
            JOIN subjects s ON ls.subject_id = s.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.class_id = $1
            ORDER BY ls.day_of_week, ls.lesson_number
        `, [classId]);
        
        const schedule = {};
        DAYS_RU.forEach(day => { schedule[day] = {}; });
        
        lessonsResult.rows.forEach(lesson => {
            const dayIndex = lesson.day_of_week - 1;
            const dayName = DAYS_RU[dayIndex];
            if (dayName) {
                schedule[dayName][lesson.lesson_number] = {
                    subject: lesson.subject_name,
                    teacher: lesson.teacher_name,
                    room: lesson.room,
                    color: lesson.subject_color
                };
            }
        });
        
        res.json({ schedule, className });
    } catch (err) {
        console.error('Error fetching class schedule:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== РЕДАКТИРОВАНИЕ РАСПИСАНИЯ ==========

// Обновить урок
router.put('/lesson', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const client = await db.getClient();
    
    try {
        const { className, dayOfWeek, lessonNumber, lesson } = req.body;
        
        if (!className || !dayOfWeek || !lessonNumber || !lesson) {
            return res.status(400).json({ message: 'Не все поля заполнены' });
        }
        
        const number = parseInt(className.match(/\d+/)?.[0] || '1');
        const letter = className.match(/[А-Я]+/)?.[0] || 'А';
        
        const classResult = await client.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [number, letter]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const classId = classResult.rows[0].id;
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const subjectId = await getSubjectIdByName(lesson.subject);
        const teacherId = await getTeacherIdByName(lesson.teacher);
        
        if (!subjectId || !teacherId) {
            return res.status(400).json({ message: 'Предмет или учитель не найдены' });
        }
        
        // Проверка существующего урока
        const existingResult = await client.query(
            'SELECT id FROM lesson_schedule WHERE class_id = $1 AND day_of_week = $2 AND lesson_number = $3',
            [classId, dayNumber, lessonNumber]
        );
        
        if (existingResult.rows.length > 0) {
            await client.query(
                `UPDATE lesson_schedule 
                 SET subject_id = $1, teacher_id = $2, room = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE class_id = $4 AND day_of_week = $5 AND lesson_number = $6`,
                [subjectId, teacherId, lesson.room, classId, dayNumber, lessonNumber]
            );
        } else {
            await client.query(
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [classId, subjectId, teacherId, dayNumber, lessonNumber, lesson.room]
            );
        }
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'edit',
            `${lesson ? 'Изменен' : 'Добавлен'} урок "${lesson.subject}" в ${className} классе, ${dayOfWeek}, ${lessonNumber} урок`,
            null
        );
        
        res.json({ success: true, message: 'Урок сохранен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating lesson:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// Удалить урок
router.delete('/lesson', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { className, dayOfWeek, lessonNumber } = req.body;
        
        const number = parseInt(className.match(/\d+/)?.[0] || '1');
        const letter = className.match(/[А-Я]+/)?.[0] || 'А';
        
        const classResult = await db.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [number, letter]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const classId = classResult.rows[0].id;
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        await db.query(
            'DELETE FROM lesson_schedule WHERE class_id = $1 AND day_of_week = $2 AND lesson_number = $3',
            [classId, dayNumber, lessonNumber]
        );
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Удален урок в ${className} классе, ${dayOfWeek}, ${lessonNumber} урок`,
            null
        );
        
        res.json({ success: true, message: 'Урок удален' });
    } catch (err) {
        console.error('Error deleting lesson:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Очистить день во всех классах
router.delete('/clear-day/:dayOfWeek', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { dayOfWeek } = req.params;
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        await db.query(
            'DELETE FROM lesson_schedule WHERE day_of_week = $1',
            [dayNumber]
        );
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Очищен день ${dayOfWeek} во всех классах`,
            null
        );
        
        res.json({ success: true, message: `День ${dayOfWeek} очищен во всех классах` });
    } catch (err) {
        console.error('Error clearing day:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Скопировать день из одного класса в другой
router.post('/copy-day', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const client = await db.getClient();
    
    try {
        const { sourceClass, targetClass, dayOfWeek } = req.body;
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const getClassId = async (className) => {
            const number = parseInt(className.match(/\d+/)?.[0] || '1');
            const letter = className.match(/[А-Я]+/)?.[0] || 'А';
            const result = await client.query(
                'SELECT id FROM classes WHERE number = $1 AND letter = $2',
                [number, letter]
            );
            return result.rows[0]?.id;
        };
        
        const sourceClassId = await getClassId(sourceClass);
        const targetClassId = await getClassId(targetClass);
        
        if (!sourceClassId || !targetClassId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        await client.query('BEGIN');
        
        const lessonsResult = await client.query(
            'SELECT subject_id, teacher_id, lesson_number, room FROM lesson_schedule WHERE class_id = $1 AND day_of_week = $2',
            [sourceClassId, dayNumber]
        );
        
        await client.query(
            'DELETE FROM lesson_schedule WHERE class_id = $1 AND day_of_week = $2',
            [targetClassId, dayNumber]
        );
        
        for (const lesson of lessonsResult.rows) {
            await client.query(
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [targetClassId, lesson.subject_id, lesson.teacher_id, dayNumber, lesson.lesson_number, lesson.room]
            );
        }
        
        await client.query('COMMIT');
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'edit',
            `Скопирован день ${dayOfWeek} из класса ${sourceClass} в ${targetClass}`,
            null
        );
        
        res.json({ success: true, message: 'День скопирован' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error copying day:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// Получить смену класса
router.get('/class-shift/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        const number = parseInt(className.match(/\d+/)?.[0] || '1');
        const letter = className.match(/[А-Я]+/)?.[0] || 'А';
        
        const result = await db.query(
            'SELECT shift FROM classes WHERE number = $1 AND letter = $2',
            [number, letter]
        );
        
        const shift = result.rows[0]?.shift || 1;
        res.json({ shift });
    } catch (err) {
        console.error('Error fetching class shift:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Проверка конфликтов
router.post('/check-conflicts', authenticateToken, async (req, res) => {
    try {
        const { className, dayOfWeek, lessonNumber, lesson } = req.body;
        
        const subjectId = await getSubjectIdByName(lesson.subject);
        const teacherId = await getTeacherIdByName(lesson.teacher);
        
        const number = parseInt(className.match(/\d+/)?.[0] || '1');
        const letter = className.match(/[А-Я]+/)?.[0] || 'А';
        
        const classResult = await db.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [number, letter]
        );
        
        const currentClassId = classResult.rows[0]?.id;
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const conflicts = [];
        
        // Проверка по кабинету
        if (lesson.room) {
            const roomConflicts = await db.query(`
                SELECT c.number, c.letter
                FROM lesson_schedule ls
                JOIN classes c ON ls.class_id = c.id
                WHERE ls.day_of_week = $1 AND ls.lesson_number = $2 AND ls.room = $3 AND ls.class_id != $4
            `, [dayNumber, lessonNumber, lesson.room, currentClassId]);
            
            roomConflicts.rows.forEach(row => {
                conflicts.push({
                    type: 'room',
                    message: `Кабинет ${lesson.room} уже занят у ${row.number}${row.letter} класса`,
                    severity: 'error',
                    conflictValue: lesson.room
                });
            });
        }
        
        // Проверка по учителю
        const teacherConflicts = await db.query(`
            SELECT c.number, c.letter
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            WHERE ls.day_of_week = $1 AND ls.lesson_number = $2 AND ls.teacher_id = $3 AND ls.class_id != $4
        `, [dayNumber, lessonNumber, teacherId, currentClassId]);
        
        teacherConflicts.rows.forEach(row => {
            conflicts.push({
                type: 'teacher',
                message: `Преподаватель ${lesson.teacher} уже ведет урок у ${row.number}${row.letter} класса`,
                severity: 'error',
                conflictValue: lesson.teacher
            });
        });
        
        res.json({ conflicts });
    } catch (err) {
        console.error('Error checking conflicts:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;