// routes/schedule.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const express = require('express');
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// Константы
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

// Вспомогательная функция для получения ID класса по имени
const classIdCache = new Map();

async function getClassIdByName(className) {
    if (classIdCache.has(className)) {
        return classIdCache.get(className);
    }
    
    console.log('🔍 Поиск класса:', className);
    
    // Пробуем найти по полному названию
    let result = await db.query(
        `SELECT id FROM classes WHERE CONCAT(number, letter) = $1 OR CONCAT(number, letter) || ' класс' = $1`,
        [className]
    );
    
    if (result.rows.length === 0) {
        const number = parseInt(className.match(/\d+/)?.[0] || '0');
        const letter = className.match(/[А-Я]/)?.[0] || '';
        
        if (number && letter) {
            result = await db.query(
                'SELECT id FROM classes WHERE number = $1 AND letter = $2',
                [number, letter]
            );
        }
    }
    
    const id = result.rows[0]?.id;
    console.log('📌 Результат поиска класса:', { className, foundId: id });
    
    if (id) {
        classIdCache.set(className, id);
        setTimeout(() => classIdCache.delete(className), 300000);
    }
    
    return id;
}

// Получение ID предмета
const subjectIdCache = new Map();

async function getSubjectIdByName(subjectName) {
    if (subjectIdCache.has(subjectName)) {
        return subjectIdCache.get(subjectName);
    }
    
    const result = await db.query(
        'SELECT id FROM lessons WHERE name = $1',
        [subjectName]
    );
    
    const id = result.rows[0]?.id;
    
    if (id) {
        subjectIdCache.set(subjectName, id);
        setTimeout(() => subjectIdCache.delete(subjectName), 300000);
    }
    
    return id;
}

// Получение ID учителя по имени
const teacherIdCache = new Map();

async function getTeacherIdByName(teacherName) {
    if (teacherIdCache.has(teacherName)) {
        return teacherIdCache.get(teacherName);
    }
    
    // Разбиваем имя на части
    const nameParts = teacherName.trim().split(/\s+/);
    const lastName = nameParts[0] || '';
    const firstName = nameParts[1] || '';
    
    let result;
    
    if (lastName && firstName) {
        result = await db.query(`
            SELECT id FROM teachers 
            WHERE last_name = $1 AND first_name = $2
        `, [lastName, firstName]);
    } else {
        result = await db.query(`
            SELECT id FROM teachers 
            WHERE CONCAT(last_name, ' ', first_name) = $1
               OR CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) = $1
        `, [teacherName]);
    }
    
    const id = result.rows[0]?.id;
    
    if (id) {
        teacherIdCache.set(teacherName, id);
        setTimeout(() => teacherIdCache.delete(teacherName), 300000);
    }
    
    return id;
}

function getSubjectColor(subject) {
    const colors = {
        'Математика': '#f59e0b',
        'Русский язык': '#10b981',
        'Литература': '#10b981',
        'Физика': '#3b82f6',
        'Химия': '#8b5cf6',
        'Биология': '#06b6d4',
        'История': '#ef4444',
        'Обществознание': '#ef4444',
        'География': '#84cc16',
        'Английский язык': '#ec4899',
        'Немецкий язык': '#ec4899',
        'Информатика': '#6366f1',
        'ОБЖ': '#21435A',
        'Физкультура': '#22c55e'
    };
    return colors[subject] || '#21435A';
}

// ========== API ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ==========

router.get('/lessons', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, description, created_at 
            FROM lessons 
            ORDER BY name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /schedule/lessons error:', err);
        res.status(500).json({ message: 'Ошибка загрузки уроков' });
    }
});

router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                r.id,
                r.number,
                r.name,
                r.priority,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', lp.id,
                            'lesson_id', lp.lesson_id,
                            'lesson_name', l.name
                        )
                    ) FILTER (WHERE lp.lesson_id IS NOT NULL),
                    '[]'::json
                ) as lesson_priorities
            FROM rooms r
            LEFT JOIN room_lesson_priorities lp ON r.id = lp.room_id
            LEFT JOIN lessons l ON lp.lesson_id = l.id
            GROUP BY r.id
            ORDER BY r.number
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /schedule/rooms error:', err);
        res.status(500).json({ message: 'Ошибка загрузки кабинетов' });
    }
});

router.get('/teachers', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id,
                t.last_name,
                t.first_name,
                t.middle_name,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name
            FROM teachers t
            ORDER BY t.last_name, t.first_name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /schedule/teachers error:', err);
        res.status(500).json({ message: 'Ошибка загрузки учителей' });
    }
});

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

router.post('/settings', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
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

// ========== ПОЛУЧЕНИЕ КЛАССОВ ==========

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

// ========== ПОЛУЧЕНИЕ РАСПИСАНИЯ ==========

router.get('/all', authenticateToken, async (req, res) => {
    try {
        const schedules = {};
        
        const classesResult = await db.query(
            'SELECT id, CONCAT(number, letter) as name FROM classes ORDER BY number, letter'
        );
        
        for (const classItem of classesResult.rows) {
            const className = classItem.name;
            const classId = classItem.id;
            
            const lessonsResult = await db.query(`
                SELECT 
                    ls.day_of_week, 
                    ls.lesson_number, 
                    ls.room,
                    l.name as subject_name,
                    CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name
                FROM lesson_schedule ls
                JOIN lessons l ON ls.subject_id = l.id
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
                        room: lesson.room
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

// ========== ПОЛУЧЕНИЕ РАСПИСАНИЯ КЛАССА (ИСПРАВЛЕННЫЙ) ==========

router.get('/class/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        console.log('🔍 Запрос расписания для класса:', className);
        
        let classId = null;
        
        const classResult = await db.query(`
            SELECT id, number, letter 
            FROM classes 
            WHERE CONCAT(number, letter) = $1 OR CONCAT(number, letter) || ' класс' = $1
        `, [className]);
        
        if (classResult.rows.length > 0) {
            classId = classResult.rows[0].id;
            console.log('✅ Найден класс:', classResult.rows[0]);
        } else {
            const number = parseInt(className.match(/\d+/)?.[0] || '0');
            const letter = className.match(/[А-Я]/)?.[0] || '';
            
            if (number && letter) {
                const result = await db.query(
                    'SELECT id FROM classes WHERE number = $1 AND letter = $2',
                    [number, letter]
                );
                if (result.rows.length > 0) {
                    classId = result.rows[0].id;
                }
            }
        }
        
        if (!classId) {
            console.log('❌ Класс не найден:', className);
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const scheduleResult = await db.query(`
            SELECT 
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher,
                ls.room,
                l.id as lesson_id,
                t.id as teacher_id
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.class_id = $1
            ORDER BY ls.day_of_week, ls.lesson_number
        `, [classId]);
        
        console.log(`📚 Найдено ${scheduleResult.rows.length} уроков для класса ${className}`);
        
        const dayMap = {
            1: 'Понедельник',
            2: 'Вторник',
            3: 'Среда',
            4: 'Четверг',
            5: 'Пятница',
            6: 'Суббота'
        };
        
        const schedule = {
            'Понедельник': [],
            'Вторник': [],
            'Среда': [],
            'Четверг': [],
            'Пятница': [],
            'Суббота': []
        };
        
        scheduleResult.rows.forEach(row => {
            const dayName = dayMap[row.day_of_week];
            if (dayName) {
                schedule[dayName].push({
                    number: row.lesson_number,
                    subject: row.subject,
                    teacher: row.teacher,
                    room: row.room,
                    lesson_id: row.lesson_id,
                    teacher_id: row.teacher_id
                });
            }
        });
        
        for (const day in schedule) {
            schedule[day].sort((a, b) => a.number - b.number);
        }
        
        res.json({ success: true, schedule, className });
        
    } catch (err) {
        console.error('❌ Ошибка получения расписания класса:', err);
        res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
});

router.get('/class-shift/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        const classId = await getClassIdByName(className);
        
        const result = await db.query(
            'SELECT shift FROM classes WHERE id = $1',
            [classId]
        );
        
        const shift = result.rows[0]?.shift || 1;
        res.json({ shift });
    } catch (err) {
        console.error('Error fetching class shift:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== ЛИЧНЫЙ КАБИНЕТ УЧИТЕЛЯ ==========

router.get('/teacher/my-schedule', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('👨‍🏫 Запрос расписания для учителя, userId:', userId);
        
        const teacherResult = await db.query(`
            SELECT id, last_name, first_name, middle_name 
            FROM teachers 
            WHERE user_id = $1
        `, [userId]);
        
        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const teacherId = teacherResult.rows[0].id;
        const teacherFullName = teacherResult.rows[0].last_name + ' ' + teacherResult.rows[0].first_name;
        console.log('✅ Найден учитель:', { id: teacherId, name: teacherFullName });
        
        const scheduleResult = await db.query(`
            SELECT 
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject,
                l.id as lesson_id,
                CONCAT(c.number, c.letter) as class_name,
                ls.room,
                c.shift
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN classes c ON ls.class_id = c.id
            WHERE ls.teacher_id = $1
            ORDER BY ls.day_of_week, ls.lesson_number
        `, [teacherId]);
        
        console.log(`📚 Найдено ${scheduleResult.rows.length} уроков для учителя`);
        
        const dayMap = {
            1: 'Понедельник',
            2: 'Вторник',
            3: 'Среда',
            4: 'Четверг',
            5: 'Пятница',
            6: 'Суббота'
        };
        
        const schedule = {
            'Понедельник': [],
            'Вторник': [],
            'Среда': [],
            'Четверг': [],
            'Пятница': [],
            'Суббота': []
        };
        
        scheduleResult.rows.forEach(row => {
            const dayName = dayMap[row.day_of_week];
            if (dayName) {
                schedule[dayName].push({
                    id: row.lesson_id,
                    number: row.lesson_number,
                    subject: row.subject,
                    className: row.class_name,
                    room: row.room,
                    shift: row.shift,
                    color: getSubjectColor(row.subject)
                });
            }
        });
        
        for (const day in schedule) {
            schedule[day].sort((a, b) => a.number - b.number);
        }
        
        res.json({ 
            success: true, 
            schedule,
            teacher: {
                id: teacherId,
                name: teacherFullName
            }
        });
    } catch (err) {
        console.error('❌ Ошибка загрузки расписания учителя:', err);
        res.status(500).json({ message: 'Ошибка загрузки расписания' });
    }
});

router.get('/teacher/my-extracurricular', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const teacherResult = await db.query(`
            SELECT id FROM teachers WHERE user_id = $1
        `, [userId]);
        
        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        const activitiesResult = await db.query(`
            SELECT 
                ek.name,
                ek.day_of_week,
                ek.start_time,
                ek.end_time,
                ek.room
            FROM extracurricular_activities ek
            WHERE ek.teacher_id = $1
            ORDER BY ek.day_of_week, ek.start_time
        `, [teacherId]);
        
        const dayMap = {
            1: 'Понедельник',
            2: 'Вторник',
            3: 'Среда',
            4: 'Четверг',
            5: 'Пятница',
            6: 'Суббота'
        };
        
        const activities = {
            'Понедельник': [],
            'Вторник': [],
            'Среда': [],
            'Четверг': [],
            'Пятница': [],
            'Суббота': []
        };
        
        activitiesResult.rows.forEach(activity => {
            const dayName = dayMap[activity.day_of_week];
            if (dayName) {
                activities[dayName].push({
                    name: activity.name,
                    startTime: activity.start_time,
                    endTime: activity.end_time,
                    room: activity.room,
                    color: '#ffa502'
                });
            }
        });
        
        res.json({ success: true, activities });
    } catch (err) {
        console.error('GET /teacher/my-extracurricular error:', err);
        res.status(500).json({ message: 'Ошибка загрузки дополнительных занятий' });
    }
});

// ========== РЕДАКТИРОВАНИЕ РАСПИСАНИЯ ==========

router.put('/lesson', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const client = await db.getClient();
    
    try {
        const { className, dayOfWeek, lessonNumber, lesson } = req.body;
        
        console.log('📝 Сохранение урока:', { className, dayOfWeek, lessonNumber, lesson });
        
        if (!className || !dayOfWeek || !lessonNumber || !lesson) {
            return res.status(400).json({ message: 'Не все поля заполнены' });
        }
        
        if (!lesson.subject || !lesson.teacher || !lesson.room) {
            return res.status(400).json({ message: 'Предмет, учитель и кабинет обязательны' });
        }
        
        const classId = await getClassIdByName(className);
        if (!classId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        if (!dayNumber) {
            return res.status(400).json({ message: 'Некорректный день недели' });
        }
        
        const subjectId = await getSubjectIdByName(lesson.subject);
        const teacherId = await getTeacherIdByName(lesson.teacher);
        
        if (!subjectId) {
            return res.status(400).json({ message: `Предмет "${lesson.subject}" не найден в базе` });
        }
        
        if (!teacherId) {
            return res.status(400).json({ message: `Учитель "${lesson.teacher}" не найден в базе` });
        }
        
        await client.query('BEGIN');
        
        const existingResult = await client.query(
            `SELECT id FROM lesson_schedule 
             WHERE class_id = $1 AND day_of_week = $2 AND lesson_number = $3`,
            [classId, dayNumber, lessonNumber]
        );
        
        if (existingResult.rows.length > 0) {
            await client.query(
                `UPDATE lesson_schedule 
                 SET subject_id = $1, teacher_id = $2, room = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE class_id = $4 AND day_of_week = $5 AND lesson_number = $6`,
                [subjectId, teacherId, lesson.room, classId, dayNumber, lessonNumber]
            );
            console.log('✏️ Урок обновлён');
        } else {
            await client.query(
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [classId, subjectId, teacherId, dayNumber, lessonNumber, lesson.room]
            );
            console.log('➕ Урок добавлен');
        }
        
        await client.query('COMMIT');
        
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
        res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    } finally {
        client.release();
    }
});

router.delete('/lesson', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { className, dayOfWeek, lessonNumber } = req.body;
        
        const classId = await getClassIdByName(className);
        if (!classId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
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

router.delete('/clear-day/:dayOfWeek', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { dayOfWeek } = req.params;
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        if (!dayNumber) {
            return res.status(400).json({ message: 'Некорректный день недели' });
        }
        
        await db.query('DELETE FROM lesson_schedule WHERE day_of_week = $1', [dayNumber]);
        
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

router.post('/copy-day', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const client = await db.getClient();
    
    try {
        const { sourceClass, targetClass, dayOfWeek } = req.body;
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const sourceClassId = await getClassIdByName(sourceClass);
        const targetClassId = await getClassIdByName(targetClass);
        
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

// ========== DRAG-AND-DROP ==========

router.post('/move-lesson', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const client = await db.getClient();
    
    try {
        const { 
            sourceClass, sourceDay, sourceLessonNumber,
            targetClass, targetDay, targetLessonNumber 
        } = req.body;
        
        const sourceClassId = await getClassIdByName(sourceClass);
        const targetClassId = await getClassIdByName(targetClass);
        
        if (!sourceClassId || !targetClassId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const sourceDayNum = dayMap[sourceDay];
        const targetDayNum = dayMap[targetDay];
        
        const lessonsResult = await client.query(`
            SELECT class_id, day_of_week, lesson_number, subject_id, teacher_id, room
            FROM lesson_schedule 
            WHERE (class_id = $1 AND day_of_week = $2 AND lesson_number = $3)
               OR (class_id = $4 AND day_of_week = $5 AND lesson_number = $6)
        `, [sourceClassId, sourceDayNum, sourceLessonNumber, targetClassId, targetDayNum, targetLessonNumber]);
        
        const sourceLesson = lessonsResult.rows.find(l => 
            l.class_id === sourceClassId && l.day_of_week === sourceDayNum && l.lesson_number === sourceLessonNumber
        );
        
        if (!sourceLesson) {
            return res.status(404).json({ message: 'Урок в исходной ячейке не найден' });
        }
        
        const targetLesson = lessonsResult.rows.find(l => 
            l.class_id === targetClassId && l.day_of_week === targetDayNum && l.lesson_number === targetLessonNumber
        );
        
        await client.query('BEGIN');
        
        await client.query(`
            DELETE FROM lesson_schedule 
            WHERE (class_id = $1 AND day_of_week = $2 AND lesson_number = $3)
               OR (class_id = $4 AND day_of_week = $5 AND lesson_number = $6)
        `, [sourceClassId, sourceDayNum, sourceLessonNumber, targetClassId, targetDayNum, targetLessonNumber]);
        
        const insertPromises = [];
        
        if (targetLesson) {
            insertPromises.push(client.query(
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sourceClassId, targetLesson.subject_id, targetLesson.teacher_id, 
                 sourceDayNum, sourceLessonNumber, targetLesson.room]
            ));
        }
        
        insertPromises.push(client.query(
            `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [targetClassId, sourceLesson.subject_id, sourceLesson.teacher_id,
             targetDayNum, targetLessonNumber, sourceLesson.room]
        ));
        
        await Promise.all(insertPromises);
        await client.query('COMMIT');
        
        logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'move',
            `Перемещен урок из ${sourceClass}, ${sourceDay}, ${sourceLessonNumber} в ${targetClass}, ${targetDay}, ${targetLessonNumber}`,
            null
        ).catch(console.error);
        
        res.json({ success: true, message: 'Урок перемещен' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error moving lesson:', err);
        res.status(500).json({ message: 'Ошибка перемещения урока' });
    } finally {
        client.release();
    }
});

// ========== ПРОВЕРКА КОНФЛИКТОВ ==========

router.post('/check-conflicts', authenticateToken, async (req, res) => {
    try {
        const { className, dayOfWeek, lessonNumber, lesson } = req.body;
        
        const classId = await getClassIdByName(className);
        if (!classId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const conflicts = [];
        
        if (lesson.room) {
            const roomConflicts = await db.query(`
                SELECT c.number, c.letter
                FROM lesson_schedule ls
                JOIN classes c ON ls.class_id = c.id
                WHERE ls.day_of_week = $1 
                  AND ls.lesson_number = $2 
                  AND ls.room = $3 
                  AND ls.class_id != $4
            `, [dayNumber, lessonNumber, lesson.room, classId]);
            
            roomConflicts.rows.forEach(row => {
                conflicts.push({
                    type: 'room',
                    message: `Кабинет ${lesson.room} уже занят у ${row.number}${row.letter} класса`,
                    severity: 'error',
                    conflictValue: lesson.room
                });
            });
        }
        
        const teacherId = await getTeacherIdByName(lesson.teacher);
        if (teacherId) {
            const teacherConflicts = await db.query(`
                SELECT c.number, c.letter
                FROM lesson_schedule ls
                JOIN classes c ON ls.class_id = c.id
                WHERE ls.day_of_week = $1 
                  AND ls.lesson_number = $2 
                  AND ls.teacher_id = $3 
                  AND ls.class_id != $4
            `, [dayNumber, lessonNumber, teacherId, classId]);
            
            teacherConflicts.rows.forEach(row => {
                conflicts.push({
                    type: 'teacher',
                    message: `Преподаватель ${lesson.teacher} уже ведет урок у ${row.number}${row.letter} класса`,
                    severity: 'error',
                    conflictValue: lesson.teacher
                });
            });
        }
        
        res.json({ conflicts });
    } catch (err) {
        console.error('Error checking conflicts:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== ВРЕМЕННЫЙ ЭНДПОИНТ ДЛЯ ОТЛАДКИ ==========

router.get('/debug/teachers', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id,
                last_name,
                first_name,
                middle_name,
                CONCAT(last_name, ' ', first_name) as short_name,
                CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) as full_name
            FROM teachers 
            ORDER BY last_name
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;