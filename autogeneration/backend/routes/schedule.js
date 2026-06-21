const express = require('express');
const db = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('./activity');
const router = express.Router();
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const classIdCache = new Map();
const subjectIdCache = new Map();
const teacherIdCache = new Map();

async function getClassIdByName(className) {
    if (classIdCache.has(className)) {
        return classIdCache.get(className);
    }
    
    console.log('🔍 Поиск класса:', className);
    
    // ✅ Сначала ищем по логину пользователя
    let result = await db.query(
        `SELECT c.id 
         FROM classes c
         JOIN users u ON c.user_id = u.id
         WHERE u.login = $1`,
        [className]
    );
    
    // Если не нашли по логину, ищем по имени класса
    if (result.rows.length === 0) {
        result = await db.query(
            `SELECT id FROM classes WHERE CONCAT(number, letter) = $1 OR CONCAT(number, letter) || ' класс' = $1`,
            [className]
        );
    }
    
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

async function getTeacherIdByName(teacherName) {
    
    if (teacherIdCache.has(teacherName)) {
        return teacherIdCache.get(teacherName);
    }
    
    console.log('🔍 Поиск учителя по имени:', teacherName);
    
    const nameParts = teacherName.trim().split(/\s+/);
    let lastName = nameParts[0] || '';
    let firstName = nameParts[1] || '';
    let middleName = nameParts[2] || '';
    
    let result;
    
    if (lastName && firstName) {
        result = await db.query(`
            SELECT id, last_name, first_name, middle_name 
            FROM teachers 
            WHERE last_name ILIKE $1 AND first_name ILIKE $2
        `, [lastName, firstName]);
        
        if (result.rows.length > 0) {
            console.log('✅ Найден учитель (вариант 1):', result.rows[0]);
            const id = result.rows[0].id;
            teacherIdCache.set(teacherName, id);
            setTimeout(() => teacherIdCache.delete(teacherName), 300000);
            return id;
        }
    }
    
    result = await db.query(`
        SELECT id, last_name, first_name, middle_name 
        FROM teachers 
        WHERE CONCAT(last_name, ' ', first_name) ILIKE $1
           OR CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) ILIKE $1
    `, [teacherName]);
    
    if (result.rows.length > 0) {
        console.log('✅ Найден учитель (вариант 2):', result.rows[0]);
        const id = result.rows[0].id;
        teacherIdCache.set(teacherName, id);
        setTimeout(() => teacherIdCache.delete(teacherName), 300000);
        return id;
    }
    
    if (lastName && firstName) {
        const firstLetter = firstName.charAt(0);
        result = await db.query(`
            SELECT id, last_name, first_name, middle_name 
            FROM teachers 
            WHERE last_name ILIKE $1 AND first_name ILIKE $2
        `, [lastName, firstLetter + '%']);
        
        if (result.rows.length > 0) {
            console.log('✅ Найден учитель (вариант 3):', result.rows[0]);
            const id = result.rows[0].id;
            teacherIdCache.set(teacherName, id);
            setTimeout(() => teacherIdCache.delete(teacherName), 300000);
            return id;
        }
    }
    
    console.log('❌ Учитель не найден:', teacherName);
    return null;
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

// ========== ПУБЛИЧНЫЕ НАСТРОЙКИ (ДЛЯ ВСЕХ РОЛЕЙ) ==========
router.get('/public-settings', authenticateToken, async (req, res) => {
    try {
        let result = await db.query('SELECT * FROM schedule_settings LIMIT 1');
        
        if (result.rows.length === 0) {
            return res.json({
                startTime: '08:00',
                lessonDuration: 40,
                maxLessonsPerDay: 7,
                shortBreakDuration: 10,
                breaks: [],
                workDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'],
                saturdayLessons: false,
                secondShift: false,
                secondShiftClasses: [],
                secondShiftStart: '14:00',
                secondShiftLessonDuration: 40,
                secondShiftMaxLessonsPerDay: 6,
                secondShiftShortBreakDuration: 10,
                secondShiftBreaks: [],
                firstGradeLessonDuration: 35,
                firstGradeMaxLessonsPerDay: 4,
                firstGradeShortBreakDuration: 15,
                firstGradeBreaks: [],
                allowEmptyLessons: false,
                balanceLoad: true
            });
        }
        
        const data = result.rows[0];
        res.json({
            startTime: data.start_time,
            lessonDuration: data.lesson_duration,
            maxLessonsPerDay: data.max_lessons_per_day,
            shortBreakDuration: data.short_break_duration,
            breaks: data.breaks || [],
            workDays: data.work_days || ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'],
            saturdayLessons: data.saturday_lessons || false,
            secondShift: data.second_shift || false,
            secondShiftClasses: data.second_shift_classes || [],
            secondShiftStart: data.second_shift_start || '14:00',
            secondShiftLessonDuration: data.second_shift_lesson_duration || 40,
            secondShiftMaxLessonsPerDay: data.second_shift_max_lessons_per_day || 6,
            secondShiftShortBreakDuration: data.second_shift_short_break_duration || 10,
            secondShiftBreaks: data.second_shift_breaks || [],
            firstGradeLessonDuration: data.first_grade_lesson_duration || 35,
            firstGradeMaxLessonsPerDay: data.first_grade_max_lessons_per_day || 4,
            firstGradeShortBreakDuration: data.first_grade_short_break_duration || 15,
            firstGradeBreaks: data.first_grade_breaks || [],
            allowEmptyLessons: data.allow_empty_lessons || false,
            balanceLoad: data.balance_load !== undefined ? data.balance_load : true
        });
    } catch (err) {
        console.error('Error getting public settings:', err);
        res.status(500).json({ message: err.message });
    }
});

// ========== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ДЛЯ ФРОНТЕНДА ==========

router.get('/public-lessons', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, short_name as "shortName", description 
            FROM lessons 
            ORDER BY name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /public-lessons error:', err);
        res.status(500).json({ message: 'Ошибка загрузки предметов' });
    }
});

router.get('/public-teachers', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id, 
                t.last_name, 
                t.first_name, 
                t.middle_name,
                t.color,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY t.last_name, t.first_name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /public-teachers error:', err);
        res.status(500).json({ message: 'Ошибка загрузки учителей' });
    }
});

router.get('/public-rooms', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, number, name 
            FROM rooms 
            ORDER BY number
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /public-rooms error:', err);
        res.status(500).json({ message: 'Ошибка загрузки кабинетов' });
    }
});

// ========== ПРИОРИТЕТНЫЕ УЧИТЕЛЯ И КАБИНЕТЫ ==========

router.get('/priority-teachers/:subjectName', authenticateToken, async (req, res) => {
    try {
        const { subjectName } = req.params;
        console.log('🔍 Поиск приоритетных учителей для предмета:', subjectName);
        
        const subject = await db.query(
            'SELECT id FROM lessons WHERE name = $1',
            [subjectName]
        );
        
        if (subject.rows.length === 0) {
            console.log('❌ Предмет не найден:', subjectName);
            return res.json([]);
        }
        
        const subjectId = subject.rows[0].id;
        
        const teachers = await db.query(`
            SELECT DISTINCT 
                t.id, 
                t.last_name, 
                t.first_name, 
                t.middle_name,
                t.color,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                CASE 
                    WHEN tl.teacher_id IS NOT NULL THEN 1 
                    ELSE 2 
                END as priority
            FROM teachers t
            LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id AND ts.subject_id = $1
            LEFT JOIN teacher_lessons tl ON t.id = tl.teacher_id AND tl.lesson_id = $1
            WHERE ts.teacher_id IS NOT NULL OR tl.teacher_id IS NOT NULL
            ORDER BY priority ASC, t.last_name ASC
        `, [subjectId]);
        
        console.log(`✅ Найдено ${teachers.rows.length} учителей для предмета ${subjectName}`);
        res.json(teachers.rows);
    } catch (err) {
        console.error('GET /priority-teachers error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/priority-rooms/:subjectName', authenticateToken, async (req, res) => {
    try {
        const { subjectName } = req.params;
        const { teacher } = req.query;
        
        console.log('🔍 Поиск приоритетных кабинетов для:', { subjectName, teacher });
        
        const subject = await db.query(
            'SELECT id FROM lessons WHERE name = $1',
            [subjectName]
        );
        
        if (subject.rows.length === 0) {
            console.log('❌ Предмет не найден:', subjectName);
            return res.json([]);
        }
        
        const subjectId = subject.rows[0].id;
        
        let query = `
            SELECT DISTINCT 
                r.id, 
                r.number, 
                r.name, 
                r.building,
                CASE 
                    WHEN rlp.lesson_id IS NOT NULL THEN 1
                    WHEN tr.teacher_id IS NOT NULL THEN 2
                    ELSE 3
                END as priority
            FROM rooms r
            LEFT JOIN room_lesson_priorities rlp ON r.id = rlp.room_id AND rlp.lesson_id = $1
        `;
        
        const params = [subjectId];
        
        if (teacher) {
            const teacherResult = await db.query(
                'SELECT id FROM teachers WHERE CONCAT(last_name, \' \', first_name) = $1 OR CONCAT(last_name, \' \', first_name, \' \', COALESCE(middle_name, \'\')) = $1',
                [teacher]
            );
            
            if (teacherResult.rows.length > 0) {
                const teacherId = teacherResult.rows[0].id;
                console.log('👨‍🏫 ID учителя:', teacherId);
                query += `
                    LEFT JOIN teacher_rooms tr ON r.id = tr.room_id AND tr.teacher_id = $2
                `;
                params.push(teacherId);
            }
        }
        
        query += `
            ORDER BY priority ASC, r.number ASC
            LIMIT 20
        `;
        
        const rooms = await db.query(query, params);
        
        console.log(`✅ Найдено ${rooms.rows.length} кабинетов для предмета ${subjectName}`);
        res.json(rooms.rows);
    } catch (err) {
        console.error('GET /priority-rooms error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

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

router.get('/admin/schedule-settings', authenticateToken, async (req, res) => {
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

router.post('/admin/schedule-settings', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
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

router.get('/class-shift/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        const classId = await getClassIdByName(className);
        
        if (!classId) {
            return res.json({ shift: 1 });
        }
        
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

// ========== ПОЛУЧЕНИЕ АКТИВНОГО РАСПИСАНИЯ ==========
router.get('/active', authenticateToken, async (req, res) => {
    try {
        console.log('📅 Запрос активного расписания');
        
        const result = await db.query(`
            SELECT 
                c.number || c.letter as class_name,
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject_name,
                CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                t.color as teacher_color,
                ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            ORDER BY c.number, c.letter, ls.day_of_week, ls.lesson_number
        `);
        
        console.log(`📚 Найдено ${result.rows.length} уроков в БД`);
        
        const schedules = {};
        const dayMap = {1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'};
        
        for (const row of result.rows) {
            if (!schedules[row.class_name]) {
                schedules[row.class_name] = {};
            }
            const dayName = dayMap[row.day_of_week];
            if (!dayName) continue;
            
            if (!schedules[row.class_name][dayName]) {
                schedules[row.class_name][dayName] = {};
            }
            
            schedules[row.class_name][dayName][row.lesson_number] = {
                subject: row.subject_name,
                teacher: row.teacher_name,
                room: row.room,
                teacherColor: row.teacher_color
            };
        }
        
        res.json({ schedules, version_id: null });
    } catch (err) {
        console.error('❌ Ошибка получения активного расписания:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// ========== ПОЛУЧЕНИЕ ЧЕРНОВИКА ==========
router.get('/draft', authenticateToken, async (req, res) => {
    try {
        console.log('📝 Запрос черновика расписания');
        
        const result = await db.query(`
            SELECT 
                c.number || c.letter as class_name,
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject_name,
                CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                t.color as teacher_color,
                ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.is_published = false
            ORDER BY c.number, c.letter, ls.day_of_week, ls.lesson_number
        `);
        
        console.log(`📚 Найдено ${result.rows.length} уроков в черновике`);
        
        const schedules = {};
        const dayMap = {1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'};
        
        for (const row of result.rows) {
            if (!schedules[row.class_name]) {
                schedules[row.class_name] = {};
            }
            const dayName = dayMap[row.day_of_week];
            if (!dayName) continue;
            
            if (!schedules[row.class_name][dayName]) {
                schedules[row.class_name][dayName] = {};
            }
            
            schedules[row.class_name][dayName][row.lesson_number] = {
                subject: row.subject_name,
                teacher: row.teacher_name,
                room: row.room,
                teacherColor: row.teacher_color
            };
        }
        
        res.json({ schedules, version_id: null });
    } catch (err) {
        console.error('❌ Ошибка получения черновика:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// ========== ПОЛУЧЕНИЕ РАСПИСАНИЯ КЛАССА (ИСПРАВЛЕНО) ==========

router.get('/class/:className', authenticateToken, async (req, res) => {
    try {
        const { className } = req.params;
        console.log('🔍 Запрос расписания для класса:', className);
        
        let classId = null;
        let classData = null;
        
        // ✅ СПОСОБ 1: Ищем класс по логину пользователя
        const userResult = await db.query(`
            SELECT u.id as user_id, u.login, c.id as class_id, c.number, c.letter
            FROM users u
            LEFT JOIN classes c ON u.id = c.user_id
            WHERE u.login = $1
        `, [className]);
        
        if (userResult.rows.length > 0 && userResult.rows[0].class_id) {
            classId = userResult.rows[0].class_id;
            classData = userResult.rows[0];
            console.log('✅ Найден класс по логину пользователя:', { 
                login: className, 
                classId, 
                className: `${classData.number}${classData.letter}` 
            });
        }
        
        // ✅ СПОСОБ 2: Если не нашли по логину, ищем по имени класса
        if (!classId) {
            const classResult = await db.query(`
                SELECT id, number, letter 
                FROM classes 
                WHERE CONCAT(number, letter) = $1 OR CONCAT(number, letter) || ' класс' = $1
            `, [className]);
            
            if (classResult.rows.length > 0) {
                classId = classResult.rows[0].id;
                classData = classResult.rows[0];
                console.log('✅ Найден класс по имени:', { 
                    className, 
                    classId,
                    name: `${classData.number}${classData.letter}`
                });
            }
        }
        
        // ✅ СПОСОБ 3: Пробуем найти по номеру и букве
        if (!classId) {
            const number = parseInt(className.match(/\d+/)?.[0] || '0');
            const letter = className.match(/[А-Я]/)?.[0] || '';
            
            if (number && letter) {
                const result = await db.query(
                    'SELECT id, number, letter FROM classes WHERE number = $1 AND letter = $2',
                    [number, letter]
                );
                if (result.rows.length > 0) {
                    classId = result.rows[0].id;
                    classData = result.rows[0];
                    console.log('✅ Найден класс по номеру и букве:', { 
                        number, 
                        letter, 
                        classId 
                    });
                }
            }
        }
        
        if (!classId) {
            console.log('❌ Класс не найден:', className);
            return res.status(404).json({ 
                success: false, 
                message: 'Класс не найден' 
            });
        }
        
        // Получаем расписание
        const scheduleResult = await db.query(`
            SELECT 
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject,
                CONCAT(t.last_name, ' ', t.first_name) as teacher,
                ls.room,
                l.id as lesson_id,
                t.id as teacher_id,
                t.color as teacher_color
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.class_id = $1
            ORDER BY ls.day_of_week, ls.lesson_number
        `, [classId]);
        
        console.log(`📚 Найдено ${scheduleResult.rows.length} уроков для класса`);
        
        const dayMap = {
            1: 'Понедельник',
            2: 'Вторник',
            3: 'Среда',
            4: 'Четверг',
            5: 'Пятница',
            6: 'Суббота'
        };
        
        const schedule = {
            'Понедельник': {},
            'Вторник': {},
            'Среда': {},
            'Четверг': {},
            'Пятница': {},
            'Суббота': {}
        };
        
        scheduleResult.rows.forEach(row => {
            const dayName = dayMap[row.day_of_week];
            if (dayName) {
                schedule[dayName][row.lesson_number] = {
                    subject: row.subject,
                    teacher: row.teacher,
                    room: row.room,
                    lesson_id: row.lesson_id,
                    teacher_id: row.teacher_id,
                    teacherColor: row.teacher_color
                };
            }
        });
        
        const displayName = classData ? `${classData.number}${classData.letter}` : className;
        
        res.json({ 
            success: true, 
            schedule, 
            className: displayName,
            classId: classId
        });
        
    } catch (err) {
        console.error('❌ Ошибка получения расписания класса:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера: ' + err.message 
        });
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
                c.shift,
                t.color as teacher_color
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN classes c ON ls.class_id = c.id
            JOIN teachers t ON ls.teacher_id = t.id
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
                    color: row.teacher_color || getSubjectColor(row.subject)
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
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6, false)`,
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
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6, false)`,
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
                `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6, false)`,
                [sourceClassId, targetLesson.subject_id, targetLesson.teacher_id, 
                 sourceDayNum, sourceLessonNumber, targetLesson.room]
            ));
        }
        
        insertPromises.push(client.query(
            `INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
             VALUES ($1, $2, $3, $4, $5, $6, false)`,
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
        const { className, dayOfWeek, lessonNumber, lesson, classId: providedClassId, className: providedClassName } = req.body;
        
        let classId = providedClassId;
        if (!classId) {
            classId = await getClassIdByName(providedClassName || className);
        }
        
        if (!classId) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const dayMap = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
        const dayNumber = dayMap[dayOfWeek];
        
        const conflicts = [];
        
        if (lesson.room) {
            const roomConflicts = await db.query(`
                SELECT c.number, c.letter, c.id
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
                SELECT c.number, c.letter, c.id
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

// ========== ПОЛУЧЕНИЕ УЧИТЕЛЕЙ ПО ПРЕДМЕТУ ==========

router.get('/teachers-by-lesson/:lessonName', authenticateToken, async (req, res) => {
    try {
        const { lessonName } = req.params;
        
        const lessonResult = await db.query(
            'SELECT id FROM lessons WHERE name = $1',
            [lessonName]
        );
        
        if (lessonResult.rows.length === 0) {
            return res.json([]);
        }
        
        const lessonId = lessonResult.rows[0].id;
        
        const teachersResult = await db.query(`
            SELECT 
                t.id,
                t.last_name,
                t.first_name,
                t.middle_name,
                t.color,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name
            FROM teachers t
            JOIN teacher_lessons tl ON t.id = tl.teacher_id
            WHERE tl.lesson_id = $1
            ORDER BY t.last_name
        `, [lessonId]);
        
        res.json(teachersResult.rows || []);
    } catch (err) {
        console.error('GET /teachers-by-lesson error:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/rooms-by-lesson/:lessonName', authenticateToken, async (req, res) => {
    try {
        const { lessonName } = req.params;
        
        const lessonResult = await db.query(
            'SELECT id FROM lessons WHERE name = $1',
            [lessonName]
        );
        
        if (lessonResult.rows.length === 0) {
            return res.json([]);
        }
        
        const lessonId = lessonResult.rows[0].id;
        
        const roomsResult = await db.query(`
            SELECT 
                r.id,
                r.number,
                r.name,
                r.priority
            FROM rooms r
            JOIN room_lesson_priorities rlp ON r.id = rlp.room_id
            WHERE rlp.lesson_id = $1
            ORDER BY r.priority DESC, r.number
        `, [lessonId]);
        
        if (roomsResult.rows.length > 0) {
            res.json(roomsResult.rows);
        } else {
            const allRooms = await db.query(`
                SELECT id, number, name, priority
                FROM rooms
                ORDER BY number
            `);
            res.json(allRooms.rows);
        }
    } catch (err) {
        console.error('GET /rooms-by-lesson error:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== ЧЕРНОВИКИ И ВЕРСИИ ==========

router.get('/draft', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.number || c.letter as class_name,
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject_name,
                CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                t.color as teacher_color,
                ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.is_published = false
            ORDER BY c.number, c.letter, ls.day_of_week, ls.lesson_number
        `);
        
        const schedules = {};
        const dayMap = {1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'};
        
        for (const row of result.rows) {
            if (!schedules[row.class_name]) {
                schedules[row.class_name] = {};
            }
            const dayName = dayMap[row.day_of_week];
            if (!schedules[row.class_name][dayName]) {
                schedules[row.class_name][dayName] = {};
            }
            schedules[row.class_name][dayName][row.lesson_number] = {
                subject: row.subject_name,
                teacher: row.teacher_name,
                room: row.room,
                teacherColor: row.teacher_color
            };
        }
        
        res.json({ schedules, version_id: null });
    } catch (err) {
        console.error('Error getting draft:', err);
        res.json({ schedules: {}, version_id: null });
    }
});

router.get('/versions', authenticateToken, async (req, res) => {
    try {
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'schedule_versions'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            return res.json([]);
        }
        
        const countResult = await db.query('SELECT COUNT(*) as count FROM schedule_versions');
        
        if (parseInt(countResult.rows[0].count) === 0) {
            return res.json([]);
        }
        
        const result = await db.query(`
            SELECT 
                v.id,
                v.version_number,
                COALESCE(v.name, 'Версия ' || v.version_number) as name,
                v.description,
                v.status,
                v.valid_from,
                v.valid_to,
                v.created_at,
                v.published_at,
                u.login as created_by_name,
                COALESCE((SELECT COUNT(*) FROM lesson_schedule WHERE version_id = v.id), 0) as lessons_count
            FROM schedule_versions v
            LEFT JOIN users u ON v.created_by = u.id
            ORDER BY v.version_number DESC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting versions:', err);
        res.json([]);
    }
});

router.get('/version/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT 
                c.number || c.letter as class_name,
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject_name,
                CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.version_id = $1
            ORDER BY c.number, c.letter, ls.day_of_week, ls.lesson_number
        `, [id]);
        
        const schedule = {};
        const dayMap = {1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'};
        
        for (const row of result.rows) {
            if (!schedule[row.class_name]) {
                schedule[row.class_name] = {};
            }
            const dayName = dayMap[row.day_of_week];
            if (!schedule[row.class_name][dayName]) {
                schedule[row.class_name][dayName] = {};
            }
            schedule[row.class_name][dayName][row.lesson_number] = {
                subject: row.subject_name,
                teacher: row.teacher_name,
                room: row.room
            };
        }
        
        res.json({ schedule });
    } catch (err) {
        console.error('Error getting version:', err);
        res.status(500).json({ message: err.message });
    }
});

// ========== ПУБЛИКАЦИЯ И СОХРАНЕНИЕ ==========

router.post('/publish', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const { schedule } = req.body;
    const client = await db.getClient();
    
    try {
        console.log('📝 Публикация расписания...');
        
        await client.query('BEGIN');
        
        await client.query('DELETE FROM lesson_schedule');
        
        let totalLessons = 0;
        const dayMap = { 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5, 'Суббота': 6 };
        
        for (const [className, days] of Object.entries(schedule)) {
            const classResult = await client.query(
                'SELECT id FROM classes WHERE CONCAT(number, letter) = $1', 
                [className]
            );
            if (classResult.rows.length === 0) {
                console.log(`❌ Класс не найден: ${className}`);
                continue;
            }
            const classId = classResult.rows[0].id;
            
            for (const [dayName, lessons] of Object.entries(days)) {
                const dayNumber = dayMap[dayName];
                if (!dayNumber) continue;
                
                for (const [lessonNumber, lesson] of Object.entries(lessons)) {
                    if (!lesson || !lesson.subject || !lesson.teacher || !lesson.room) continue;
                    
                    const subjectResult = await client.query(
                        'SELECT id FROM lessons WHERE name = $1', 
                        [lesson.subject]
                    );
                    if (subjectResult.rows.length === 0) {
                        console.log(`❌ Предмет не найден: ${lesson.subject}`);
                        continue;
                    }
                    const subjectId = subjectResult.rows[0].id;
                    
                    const nameParts = lesson.teacher.trim().split(/\s+/);
                    const lastName = nameParts[0] || '';
                    const firstName = nameParts[1] || '';
                    
                    const teacherResult = await client.query(
                        'SELECT id FROM teachers WHERE last_name = $1 AND first_name LIKE $2',
                        [lastName, `%${firstName}%`]
                    );
                    if (teacherResult.rows.length === 0) {
                        console.log(`❌ Учитель не найден: ${lesson.teacher}`);
                        continue;
                    }
                    const teacherId = teacherResult.rows[0].id;
                    
                    await client.query(`
                        INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
                        VALUES ($1, $2, $3, $4, $5, $6, true)
                    `, [classId, subjectId, teacherId, dayNumber, parseInt(lessonNumber), lesson.room]);
                    
                    totalLessons++;
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Опубликовано ${totalLessons} уроков`);
        
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'publish',
            `Опубликовано расписание (${totalLessons} уроков)`,
            null
        );
        
        res.json({ success: true, message: `Расписание опубликовано (${totalLessons} уроков)` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка публикации:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.post('/save-draft', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const { schedule } = req.body;
    const client = await db.getClient();
    
    try {
        console.log('📝 Сохранение черновика...');
        
        await client.query('BEGIN');
        
        await client.query('DELETE FROM lesson_schedule WHERE is_published = false');
        
        let totalLessons = 0;
        const dayMap = { 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5, 'Суббота': 6 };
        
        for (const [className, days] of Object.entries(schedule)) {
            const classResult = await client.query(
                'SELECT id FROM classes WHERE CONCAT(number, letter) = $1', 
                [className]
            );
            if (classResult.rows.length === 0) continue;
            const classId = classResult.rows[0].id;
            
            for (const [dayName, lessons] of Object.entries(days)) {
                const dayNumber = dayMap[dayName];
                if (!dayNumber) continue;
                
                for (const [lessonNumber, lesson] of Object.entries(lessons)) {
                    if (!lesson || !lesson.subject || !lesson.teacher || !lesson.room) continue;
                    
                    const subjectResult = await client.query(
                        'SELECT id FROM lessons WHERE name = $1', 
                        [lesson.subject]
                    );
                    if (subjectResult.rows.length === 0) continue;
                    const subjectId = subjectResult.rows[0].id;
                    
                    const nameParts = lesson.teacher.trim().split(/\s+/);
                    const lastName = nameParts[0] || '';
                    const firstName = nameParts[1] || '';
                    
                    const teacherResult = await client.query(
                        'SELECT id FROM teachers WHERE last_name = $1 AND first_name LIKE $2',
                        [lastName, `%${firstName}%`]
                    );
                    if (teacherResult.rows.length === 0) continue;
                    const teacherId = teacherResult.rows[0].id;
                    
                    await client.query(`
                        INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room, is_published)
                        VALUES ($1, $2, $3, $4, $5, $6, false)
                    `, [classId, subjectId, teacherId, dayNumber, parseInt(lessonNumber), lesson.room]);
                    
                    totalLessons++;
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Сохранен черновик: ${totalLessons} уроков`);
        
        res.json({ success: true, message: `Черновик сохранен (${totalLessons} уроков)` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка сохранения черновика:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.post('/publish-version/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('UPDATE lesson_schedule SET is_published = false WHERE is_published = true');
        await db.query('UPDATE lesson_schedule SET is_published = true WHERE version_id = $1', [id]);
        await db.query('UPDATE schedule_versions SET status = $1 WHERE id = $2', ['published', id]);
        
        res.json({ success: true, message: 'Версия опубликована' });
    } catch (err) {
        console.error('Error publishing version:', err);
        res.status(500).json({ message: err.message });
    }
});

// ========== ПРИОРИТЕТЫ ПО КЛАССАМ ==========

router.get('/class-teachers/:subjectName', authenticateToken, async (req, res) => {
    try {
        const { subjectName } = req.params;
        const { classId, className } = req.query;
        
        console.log('🔍 Поиск учителей для класса:', { subjectName, classId, className });
        
        if (!classId) {
            console.log('❌ Нет classId');
            return res.json([]);
        }
        
        const subject = await db.query('SELECT id FROM lessons WHERE name = $1', [subjectName]);
        if (subject.rows.length === 0) {
            console.log('❌ Предмет не найден:', subjectName);
            return res.json([]);
        }

        const subjectId = subject.rows[0].id;
        
        const teachers = await db.query(`
            SELECT DISTINCT 
                t.id,
                t.last_name,
                t.first_name,
                t.middle_name,
                t.color,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                COUNT(DISTINCT ls.id) as lesson_count
            FROM teachers t
            JOIN lesson_schedule ls ON t.id = ls.teacher_id
            JOIN lessons l ON ls.subject_id = l.id
            WHERE ls.class_id = $1 AND l.id = $2
            GROUP BY t.id
            ORDER BY lesson_count DESC, t.last_name ASC
        `, [classId, subjectId]);
        
        console.log(`✅ Найдено ${teachers.rows.length} учителей`);
        res.json(teachers.rows);
    } catch (err) {
        console.error('GET /class-teachers error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/class-rooms/:subjectName', authenticateToken, async (req, res) => {
    try {
        const { subjectName } = req.params;
        const { classId, teacher } = req.query;
        
        console.log('🔍 Поиск кабинетов:', { subjectName, classId, teacher });
        
        if (!classId || !teacher) {
            console.log('❌ Нет classId или teacher');
            return res.json([]);
        }
        
        const subject = await db.query('SELECT id FROM lessons WHERE name = $1', [subjectName]);
        if (subject.rows.length === 0) {
            console.log('❌ Предмет не найден:', subjectName);
            return res.json([]);
        }
        const subjectId = subject.rows[0].id;
        
        const nameParts = teacher.trim().split(/\s+/);
        const lastName = nameParts[0] || '';
        const firstName = nameParts[1] || '';
        
        const teacherResult = await db.query(`
            SELECT id FROM teachers 
            WHERE last_name ILIKE $1 AND first_name ILIKE $2
        `, [lastName, firstName ? `%${firstName}%` : '%']);
        
        if (teacherResult.rows.length === 0) {
            console.log('❌ Учитель не найден:', teacher);
            return res.json([]);
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        const rooms = await db.query(`
            SELECT DISTINCT 
                r.id,
                r.number,
                r.name,
                r.building,
                COUNT(ls.id) as lesson_count
            FROM rooms r
            INNER JOIN lesson_schedule ls ON r.number = ls.room
            WHERE ls.class_id = $1 AND ls.teacher_id = $2 AND ls.subject_id = $3
            GROUP BY r.id, r.number, r.name, r.building
            ORDER BY lesson_count DESC, r.number ASC
        `, [classId, teacherId, subjectId]);
        
        console.log(`✅ Найдено ${rooms.rows.length} кабинетов`);
        res.json(rooms.rows);
    } catch (err) {
        console.error('GET /class-rooms error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/class-subjects/:classId', authenticateToken, async (req, res) => {
    try {
        const { classId } = req.params;
        
        console.log('🔍 Поиск предметов для класса:', classId);
        
        const results = await db.query(`
            SELECT DISTINCT
                l.id as lesson_id,
                l.name as lesson_name,
                l.short_name,
                t.id as teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                t.color as teacher_color,
                r.number as room_number,
                r.name as room_name,
                COUNT(DISTINCT ls.id) as lesson_count
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            LEFT JOIN rooms r ON ls.room = r.number
            WHERE ls.class_id = $1
            GROUP BY l.id, t.id, r.id
            ORDER BY l.name, lesson_count DESC
        `, [classId]);
        
        const subjectsMap = {};
        results.rows.forEach(row => {
            if (!subjectsMap[row.lesson_id]) {
                subjectsMap[row.lesson_id] = {
                    id: row.lesson_id,
                    name: row.lesson_name,
                    short_name: row.short_name,
                    teachers: []
                };
            }
            subjectsMap[row.lesson_id].teachers.push({
                id: row.teacher_id,
                name: row.teacher_name,
                color: row.teacher_color,
                room: row.room_number ? { number: row.room_number, name: row.room_name } : null,
                lesson_count: row.lesson_count
            });
        });
        
        const subjects = Object.values(subjectsMap);
        console.log(`✅ Найдено ${subjects.length} предметов`);
        res.json(subjects);
    } catch (err) {
        console.error('GET /class-subjects error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/teacher-schedule/:teacherId/:classId/:subjectId', authenticateToken, async (req, res) => {
    try {
        const { teacherId, classId, subjectId } = req.params;
        
        const lessons = await db.query(`
            SELECT id, day_of_week, lesson_number, room
            FROM lesson_schedule
            WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3
            ORDER BY day_of_week, lesson_number
        `, [teacherId, classId, subjectId]);
        
        res.json(lessons.rows);
    } catch (err) {
        console.error('GET /teacher-schedule error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ ОТЛАДКИ ==========

router.get('/debug/data', authenticateToken, async (req, res) => {
    try {
        const lessons = await db.query('SELECT COUNT(*) as count FROM lesson_schedule');
        const classes = await db.query('SELECT COUNT(*) as count FROM classes');
        const teachers = await db.query('SELECT COUNT(*) as count FROM teachers');
        const subjects = await db.query('SELECT COUNT(*) as count FROM lessons');
        const sample = await db.query

        (`
            SELECT 
                c.number || c.letter as class_name,
                l.name as subject,
                CONCAT(t.last_name, ' ', t.first_name) as teacher,
                ls.day_of_week,
                ls.lesson_number,
                ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            LIMIT 5
        `);
        
        res.json({
            lesson_schedule_count: parseInt(lessons.rows[0].count),
            classes_count: parseInt(classes.rows[0].count),
            teachers_count: parseInt(teachers.rows[0].count),
            subjects_count: parseInt(subjects.rows[0].count),
            sample_lessons: sample.rows
        });
    } catch (err) {
        console.error('Debug error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== ПОЛУЧЕНИЕ РАСПИСАНИЯ ПО ID КЛАССА ==========

router.get('/class/:classId', authenticateToken, async (req, res) => {
    try {
        const { classId } = req.params;
        console.log('🔍 Запрос расписания для класса по ID:', classId);
        
        // Проверяем, существует ли класс
        let classResult = await db.query(`
            SELECT id, number, letter 
            FROM classes 
            WHERE id = $1 OR user_id = $1
        `, [classId]);
        
        // Если не нашли по ID, пробуем найти по логину пользователя
        if (classResult.rows.length === 0) {
            classResult = await db.query(`
                SELECT c.id, c.number, c.letter 
                FROM classes c
                JOIN users u ON c.user_id = u.id
                WHERE u.login = $1
            `, [classId]);
        }
        
        if (classResult.rows.length === 0) {
            console.log('❌ Класс не найден для ID:', classId);
            return res.status(404).json({ 
                success: false, 
                message: 'Класс не найден' 
            });
        }
        
        const classData = classResult.rows[0];
        const classIdNum = classData.id;
        const className = `${classData.number}${classData.letter}`;
        
        console.log('✅ Найден класс:', { id: classIdNum, name: className });
        
        // Получаем расписание для класса
        const scheduleResult = await db.query(`
            SELECT 
                ls.id,
                ls.day_of_week,
                ls.lesson_number,
                l.name as subject,
                CONCAT(t.last_name, ' ', t.first_name) as teacher,
                ls.room,
                l.id as lesson_id,
                t.id as teacher_id,
                t.color as teacher_color
            FROM lesson_schedule ls
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            WHERE ls.class_id = $1
            ORDER BY ls.day_of_week, ls.lesson_number
        `, [classIdNum]);
        
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
            'Понедельник': {},
            'Вторник': {},
            'Среда': {},
            'Четверг': {},
            'Пятница': {},
            'Суббота': {}
        };
        
        scheduleResult.rows.forEach(row => {
            const dayName = dayMap[row.day_of_week];
            if (dayName) {
                schedule[dayName][row.lesson_number] = {
                    subject: row.subject,
                    teacher: row.teacher,
                    room: row.room,
                    lesson_id: row.lesson_id,
                    teacher_id: row.teacher_id,
                    teacherColor: row.teacher_color
                };
            }
        });
        
        res.json({ 
            success: true, 
            schedule, 
            className,
            classId: classIdNum
        });
        
    } catch (err) {
        console.error('❌ Ошибка получения расписания класса:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера: ' + err.message 
        });
    }
});

// ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О КЛАССЕ ПО ID ==========

router.get('/class-info/:classId', authenticateToken, async (req, res) => {
    try {
        const { classId } = req.params;
        console.log('🔍 Запрос информации о классе по ID:', classId);
        
        let result = await db.query(`
            SELECT 
                c.id,
                c.number || c.letter as name,
                c.number,
                c.letter,
                c.shift,
                c.max_lessons_per_day,
                c.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                u.login
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 OR c.user_id = $1 OR u.login = $1
        `, [classId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Класс не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('GET /class-info error:', error);
        res.status(500).json({ error: 'Ошибка загрузки информации о классе' });
    }
});

module.exports = router;