// backend/routes/admin.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const axios = require('axios');
const db = require('../models/database');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// ============= ПОЛУЧЕНИЕ ДАННЫХ =============

router.get('/classes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, number, letter, CONCAT(number, letter) as name, shift
            FROM classes ORDER BY number, letter
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/teachers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, last_name, first_name, middle_name, 
                   CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) as name
            FROM teachers ORDER BY last_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting teachers:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/teachers-with-subjects', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                COALESCE((SELECT json_agg(l.name) FROM teacher_lessons tl JOIN lessons l ON tl.lesson_id = l.id WHERE tl.teacher_id = t.id), '[]'::json) as subjects,
                COALESCE((SELECT json_agg(r.number) FROM teacher_rooms tr JOIN rooms r ON tr.room_id = r.id WHERE tr.teacher_id = t.id), '[]'::json) as "officeNumbers",
                t.color,
                COALESCE((SELECT json_agg(tca.class_id) FROM teacher_class_assignments tca WHERE tca.teacher_id = t.id), '[]'::json) as "classIds"
            FROM teachers t ORDER BY t.last_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting teachers with subjects:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/lessons', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, name, short_name FROM lessons ORDER BY name`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting lessons:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.id, r.number, r.name,
                   COALESCE((SELECT json_agg(l.name) FROM room_lesson_priorities rlp JOIN lessons l ON rlp.lesson_id = l.id WHERE rlp.room_id = r.id), '[]'::json) as "preferredSubjects"
            FROM rooms r
            ORDER BY CASE WHEN r.number ~ '^[0-9]+$' THEN CAST(r.number AS INTEGER) ELSE 9999 END, r.number
        `);
        const rooms = result.rows.map(row => ({
            id: row.id,
            number: String(row.number),
            name: row.name || '',
            preferredSubjects: row.preferredSubjects || []
        }));
        res.json(rooms);
    } catch (error) {
        console.error('Error getting rooms:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============= НАСТРОЙКИ РАСПИСАНИЯ ДЛЯ ГЕНЕРАТОРА =============

router.get('/schedule-settings', async (req, res) => {
    try {
        let result = await db.query('SELECT * FROM schedule_settings LIMIT 1');
        
        if (result.rows.length === 0) {
            await db.query(`
                INSERT INTO schedule_settings (
                    start_time, lesson_duration, max_lessons_per_day, short_break_duration, breaks,
                    work_days, saturday_lessons, second_shift, second_shift_classes, second_shift_start,
                    second_shift_lesson_duration, second_shift_max_lessons_per_day, second_shift_short_break_duration,
                    second_shift_breaks, first_grade_lesson_duration, first_grade_max_lessons_per_day,
                    first_grade_short_break_duration, first_grade_breaks, allow_empty_lessons, balance_load
                ) VALUES (
                    '08:00', 40, 7, 10, '[]',
                    ARRAY['Пн', 'Вт', 'Ср', 'Чт', 'Пт'], false, false, ARRAY[]::text[], '14:00',
                    40, 6, 10, '[]', 35, 4, 15, '[]', false, true
                )
            `);
            result = await db.query('SELECT * FROM schedule_settings LIMIT 1');
        }
        
        const data = result.rows[0];
        res.json({
            startTime: data.start_time,
            lessonDuration: data.lesson_duration,
            maxLessonsPerDay: data.max_lessons_per_day,
            shortBreakDuration: data.short_break_duration,
            breaks: data.breaks || [],
            workDays: data.work_days || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
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
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/schedule-settings', async (req, res) => {
    try {
        const settings = req.body;
        
        const existing = await db.query('SELECT id FROM schedule_settings LIMIT 1');
        
        if (existing.rows.length === 0) {
            await db.query(`
                INSERT INTO schedule_settings (
                    start_time, lesson_duration, max_lessons_per_day, short_break_duration, breaks,
                    work_days, saturday_lessons, second_shift, second_shift_classes, second_shift_start,
                    second_shift_lesson_duration, second_shift_max_lessons_per_day, second_shift_short_break_duration,
                    second_shift_breaks, first_grade_lesson_duration, first_grade_max_lessons_per_day,
                    first_grade_short_break_duration, first_grade_breaks, allow_empty_lessons, balance_load
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
            `, [
                settings.startTime,
                settings.lessonDuration,
                settings.maxLessonsPerDay,
                settings.shortBreakDuration,
                JSON.stringify(settings.breaks || []),
                settings.workDays || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
                settings.saturdayLessons || false,
                settings.secondShift || false,
                settings.secondShiftClasses || [],
                settings.secondShiftStart || '14:00',
                settings.secondShiftLessonDuration || 40,
                settings.secondShiftMaxLessonsPerDay || 6,
                settings.secondShiftShortBreakDuration || 10,
                JSON.stringify(settings.secondShiftBreaks || []),
                settings.firstGradeLessonDuration || 35,
                settings.firstGradeMaxLessonsPerDay || 4,
                settings.firstGradeShortBreakDuration || 15,
                JSON.stringify(settings.firstGradeBreaks || []),
                settings.allowEmptyLessons || false,
                settings.balanceLoad !== undefined ? settings.balanceLoad : true
            ]);
        } else {
            await db.query(`
                UPDATE schedule_settings SET
                    start_time = $1,
                    lesson_duration = $2,
                    max_lessons_per_day = $3,
                    short_break_duration = $4,
                    breaks = $5,
                    work_days = $6,
                    saturday_lessons = $7,
                    second_shift = $8,
                    second_shift_classes = $9,
                    second_shift_start = $10,
                    second_shift_lesson_duration = $11,
                    second_shift_max_lessons_per_day = $12,
                    second_shift_short_break_duration = $13,
                    second_shift_breaks = $14,
                    first_grade_lesson_duration = $15,
                    first_grade_max_lessons_per_day = $16,
                    first_grade_short_break_duration = $17,
                    first_grade_breaks = $18,
                    allow_empty_lessons = $19,
                    balance_load = $20,
                    updated_at = NOW()
                WHERE id = $21
            `, [
                settings.startTime,
                settings.lessonDuration,
                settings.maxLessonsPerDay,
                settings.shortBreakDuration,
                JSON.stringify(settings.breaks || []),
                settings.workDays || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
                settings.saturdayLessons || false,
                settings.secondShift || false,
                settings.secondShiftClasses || [],
                settings.secondShiftStart || '14:00',
                settings.secondShiftLessonDuration || 40,
                settings.secondShiftMaxLessonsPerDay || 6,
                settings.secondShiftShortBreakDuration || 10,
                JSON.stringify(settings.secondShiftBreaks || []),
                settings.firstGradeLessonDuration || 35,
                settings.firstGradeMaxLessonsPerDay || 4,
                settings.firstGradeShortBreakDuration || 15,
                JSON.stringify(settings.firstGradeBreaks || []),
                settings.allowEmptyLessons || false,
                settings.balanceLoad !== undefined ? settings.balanceLoad : true,
                existing.rows[0].id
            ]);
        }
        
        console.log('✅ Настройки сохранены');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/schedule', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.number || c.letter as class_name, ls.day_of_week, ls.lesson_number,
                   l.name as subject_name, CONCAT(t.last_name, ' ', t.first_name) as teacher_name, ls.room
            FROM lesson_schedule ls
            JOIN classes c ON ls.class_id = c.id
            JOIN lessons l ON ls.subject_id = l.id
            JOIN teachers t ON ls.teacher_id = t.id
            ORDER BY c.number, c.letter, ls.day_of_week, ls.lesson_number
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting schedule:', error);
        res.status(500).json({ message: error.message });
    }
});

// ============= ГЕНЕРАЦИЯ РАСПИСАНИЯ =============

router.get('/generation-rules', async (req, res) => {
    try {
        const classesResult = await db.query(`
            SELECT c.id, c.number, c.letter, c.shift, c.max_lessons_per_day,
                   CONCAT(c.number, c.letter) as name
            FROM classes c ORDER BY c.number, c.letter
        `);

        const teachersResult = await db.query(`
            SELECT t.id, t.last_name, t.first_name, t.middle_name, 
                   t.color,
                   t.max_consecutive_lessons, 
                   t.unavailable_days,
                   COALESCE((SELECT json_agg(tl.lesson_id) FROM teacher_lessons tl WHERE tl.teacher_id = t.id), '[]'::json) as lesson_ids,
                   COALESCE((SELECT json_agg(tca.class_id) FROM teacher_class_assignments tca WHERE tca.teacher_id = t.id), '[]'::json) as class_ids,
                   COALESCE((SELECT json_agg(tr.room_id) FROM teacher_rooms tr WHERE tr.teacher_id = t.id), '[]'::json) as room_ids
            FROM teachers t 
            ORDER BY t.last_name
        `);

        const roomsResult = await db.query(`
            SELECT r.id, r.number, r.name,
                   COALESCE((SELECT json_agg(lp.lesson_id) FROM room_lesson_priorities lp WHERE lp.room_id = r.id), '[]'::json) as preferred_lesson_ids
            FROM rooms r
        `);

        const lessonsResult = await db.query(`SELECT id, name, short_name FROM lessons`);
        const difficultyResult = await db.query(`SELECT grade, subject_id, difficulty_rank, subject_type FROM subject_difficulty`);
        const hoursResult = await db.query(`SELECT grade, subject_id, hours_per_week FROM subject_hours`);
        const dailyLimits = await db.query(`SELECT grade, day_name, min_weight, max_weight, max_lessons FROM daily_load_limits`);
        
        const settingsResult = await db.query('SELECT * FROM schedule_settings LIMIT 1');
        const settings = settingsResult.rows[0] || {};

        res.json({
            classes: classesResult.rows,
            teachers: teachersResult.rows,
            rooms: roomsResult.rows,
            lessons: lessonsResult.rows,
            subjectDifficulty: difficultyResult.rows,
            subjectHours: hoursResult.rows,
            dailyLimits: dailyLimits.rows,
            scheduleSettings: {
                startTime: settings.start_time || '08:00',
                lessonDuration: settings.lesson_duration || 40,
                maxLessonsPerDay: settings.max_lessons_per_day || 7,
                shortBreakDuration: settings.short_break_duration || 10,
                breaks: settings.breaks || [],
                workDays: settings.work_days || ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
                saturdayLessons: settings.saturday_lessons || false,
                secondShift: settings.second_shift || false,
                secondShiftStart: settings.second_shift_start || '14:00',
                secondShiftLessonDuration: settings.second_shift_lesson_duration || 40,
                secondShiftMaxLessonsPerDay: settings.second_shift_max_lessons_per_day || 6,
                secondShiftShortBreakDuration: settings.second_shift_short_break_duration || 10,
                secondShiftBreaks: settings.second_shift_breaks || [],
                firstGradeLessonDuration: settings.first_grade_lesson_duration || 35,
                firstGradeMaxLessonsPerDay: settings.first_grade_max_lessons_per_day || 4,
                firstGradeShortBreakDuration: settings.first_grade_short_break_duration || 15,
                firstGradeBreaks: settings.first_grade_breaks || [],
                allowEmptyLessons: settings.allow_empty_lessons || false,
                balanceLoad: settings.balance_load !== undefined ? settings.balance_load : true
            }
        });
    } catch (err) {
        console.error('Ошибка получения правил:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= ИСПРАВЛЕННЫЙ ЭНДПОИНТ ГЕНЕРАЦИИ =============

router.post('/generate-schedule', async (req, res) => {
    console.log('\n🚀 ========== ЗАПУСК ГЕНЕРАЦИИ РАСПИСАНИЯ ==========\n');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Нет токена' });
    }

    try {
        // ✅ ИСПОЛЬЗУЕМ ПЕРЕМЕННУЮ ОКРУЖЕНИЯ ДЛЯ URL ГЕНЕРАТОРА
        const generatorUrl = process.env.GENERATOR_URL || process.env.SCHEDULE_GENERATOR_URL || 'http://localhost:5001';
        
        console.log(`🔍 Проверка доступности C# генератора на ${generatorUrl}...`);
        
        try {
            const healthCheck = await axios.get(`${generatorUrl}/health`, { timeout: 3000 });
            console.log('✅ C# генератор доступен');
        } catch (healthError) {
            console.log('❌ C# генератор НЕ доступен, пробуем использовать локальную генерацию...');
            
            // ✅ Если генератор не доступен - используем локальную генерацию
            const localSchedule = await generateLocalSchedule();
            if (localSchedule) {
                return res.json({
                    success: true,
                    schedule: localSchedule,
                    totalLessons: Object.values(localSchedule).reduce((acc, days) => {
                        let count = 0;
                        for (const lessons of Object.values(days)) {
                            count += lessons.length;
                        }
                        return acc + count;
                    }, 0),
                    classesProcessed: Object.keys(localSchedule).length,
                    message: 'Расписание сгенерировано локально (C# генератор недоступен)'
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: 'C# генератор не запущен. Добавьте переменную GENERATOR_URL на Render или запустите локально.'
            });
        }
        
        const rulesUrl = `${req.protocol}://${req.get('host')}/api/admin/generation-rules`;
        console.log(`📡 Отправка запроса к C# генератору: ${generatorUrl}/api/generate`);
        console.log(`📋 URL правил: ${rulesUrl}`);
        
        const response = await axios.post(`${generatorUrl}/api/generate`, {
            rulesUrl: rulesUrl,
            token: token
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 300000
        });
        
        console.log('📦 Ответ от C# генератора получен');
        
        if (!response.data?.success) {
            throw new Error(response.data?.error || 'Ошибка генерации');
        }
        
        const schedule = response.data.schedule;
        if (!schedule || Object.keys(schedule).length === 0) {
            throw new Error('Расписание пустое');
        }
        
        console.log(`📊 Получено расписание для ${Object.keys(schedule).length} классов`);
        
        // Сохраняем в БД
        const saved = await saveScheduleToDB(schedule);
        
        res.json({ 
            success: true, 
            schedule: schedule,
            totalLessons: saved.totalLessons,
            classesProcessed: saved.classesProcessed,
            message: `Расписание сгенерировано. ${saved.totalLessons} уроков для ${saved.classesProcessed} классов`
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации:', error);
        
        // ✅ Если C# генератор упал - пробуем локальную генерацию
        try {
            console.log('🔄 Пробуем локальную генерацию...');
            const localSchedule = await generateLocalSchedule();
            if (localSchedule) {
                const saved = await saveScheduleToDB(localSchedule);
                return res.json({
                    success: true,
                    schedule: localSchedule,
                    totalLessons: saved.totalLessons,
                    classesProcessed: saved.classesProcessed,
                    message: `Расписание сгенерировано локально (ошибка C# генератора). ${saved.totalLessons} уроков.`
                });
            }
        } catch (localErr) {
            console.error('❌ Локальная генерация тоже не удалась:', localErr);
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Ошибка генерации расписания',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

async function saveScheduleToDB(schedule) {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM lesson_schedule');
        
        let totalLessons = 0;
        const dayMap = { 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5, 'Суббота': 6 };
        const classesProcessed = new Set();
        
        for (const [className, days] of Object.entries(schedule)) {
            console.log(`📝 Обработка класса ${className}`);
            
            const classResult = await client.query(`
                SELECT id FROM classes 
                WHERE CONCAT(number, letter) = $1
            `, [className]);
            
            if (classResult.rows.length === 0) {
                console.log(`⚠️ Класс ${className} не найден в БД`);
                continue;
            }
            const classId = classResult.rows[0].id;
            classesProcessed.add(className);
            
            for (const [dayName, lessons] of Object.entries(days)) {
                const dayNumber = dayMap[dayName];
                if (!dayNumber) {
                    console.log(`⚠️ Неизвестный день: ${dayName}`);
                    continue;
                }
                
                if (!Array.isArray(lessons)) {
                    console.log(`⚠️ День ${dayName} не содержит массив уроков`);
                    continue;
                }
                
                for (const lesson of lessons) {
                    const subjectName = lesson.subject || lesson.Subject;
                    const teacherName = lesson.teacher || lesson.Teacher;
                    const room = lesson.office || lesson.Room || lesson.office;
                    const lessonNumber = lesson.lessonNumber || lesson.LessonNumber || 1;
                    
                    if (!subjectName) continue;
                    
                    const subjectResult = await client.query('SELECT id FROM lessons WHERE LOWER(name) = LOWER($1)', [subjectName]);
                    if (subjectResult.rows.length === 0) continue;
                    const subjectId = subjectResult.rows[0].id;
                    
                    let teacherId = null;
                    if (teacherName && teacherName.trim()) {
                        const nameParts = teacherName.trim().split(' ');
                        if (nameParts.length >= 1) {
                            const lastName = nameParts[0];
                            const firstName = nameParts.length > 1 ? nameParts[1] : '';
                            
                            let query = 'SELECT id FROM teachers WHERE last_name = $1';
                            let params = [lastName];
                            
                            if (firstName) {
                                query += ' AND first_name LIKE $2';
                                params.push(firstName + '%');
                            }
                            
                            const teacherResult = await client.query(query, params);
                            if (teacherResult.rows.length > 0) {
                                teacherId = teacherResult.rows[0].id;
                            }
                        }
                    }
                    
                    if (!teacherId) continue;
                    
                    await client.query(`
                        INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [classId, subjectId, teacherId, dayNumber, lessonNumber, room || '']);
                    totalLessons++;
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Сохранено ${totalLessons} уроков в БД`);
        
        return { totalLessons, classesProcessed: classesProcessed.size };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function generateLocalSchedule() {
    // Простая заглушка для локальной генерации
    const classes = await db.query('SELECT id, CONCAT(number, letter) as name FROM classes');
    const lessons = await db.query('SELECT id, name FROM lessons');
    const teachers = await db.query('SELECT id, last_name, first_name FROM teachers');
    
    if (classes.rows.length === 0 || lessons.rows.length === 0 || teachers.rows.length === 0) {
        return null;
    }
    
    const schedule = {};
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    
    for (const cls of classes.rows) {
        schedule[cls.name] = {};
        
        for (const day of days) {
            schedule[cls.name][day] = [];
            
            // Добавляем по 3-4 урока для примера
            const numLessons = Math.min(4 + Math.floor(Math.random() * 2), lessons.rows.length);
            const shuffledLessons = [...lessons.rows].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < numLessons && i < shuffledLessons.length; i++) {
                const teacher = teachers.rows[i % teachers.rows.length];
                schedule[cls.name][day].push({
                    subject: shuffledLessons[i].name,
                    teacher: `${teacher.last_name} ${teacher.first_name}`,
                    office: `${100 + Math.floor(Math.random() * 50)}`,
                    lessonNumber: i + 1
                });
            }
        }
    }
    
    return schedule;
}

module.exports = router;