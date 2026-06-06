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

// ============= ЕДИНЫЙ ЭНДПОИНТ ДЛЯ ГЕНЕРАТОРА =============

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

        console.log(`📊 Данные для генератора: классы=${classesResult.rows.length}, учителя=${teachersResult.rows.length}, предметы=${lessonsResult.rows.length}, часы=${hoursResult.rows.length}`);

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

// ============= ГЕНЕРАЦИЯ РАСПИСАНИЯ (ЧЕРЕЗ C# МИКРОСЕРВИС) =============

router.post('/generate-schedule', async (req, res) => {
    console.log('\n🚀 ========== ЗАПУСК ГЕНЕРАЦИИ РАСПИСАНИЯ ==========\n');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Нет токена' });
    }

    try {
        const generatorUrl = process.env.GENERATOR_URL || 'http://localhost:5001';
        
        console.log(`🔍 Проверка доступности C# генератора на ${generatorUrl}...`);
        
        // Проверяем доступность генератора
        try {
            const healthCheck = await axios.get(`${generatorUrl}/health`, { timeout: 3000 });
            console.log('✅ C# генератор доступен');
        } catch (healthError) {
            console.log('❌ C# генератор НЕ доступен');
            return res.status(500).json({ 
                success: false, 
                message: 'C# генератор не запущен. Запустите его: cd SchoolScheduleLessonsPlanning && dotnet run'
            });
        }
        
        const rulesUrl = `http://localhost:5000/api/admin/generation-rules`;
        console.log(`📡 URL правил: ${rulesUrl}`);
        
        console.log(`📤 Отправка запроса к C# генератору...`);
        
        const response = await axios.post(`${generatorUrl}/api/generate`, {
            rulesUrl: rulesUrl,
            token: token
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 300000
        });
        
        console.log(`📥 Ответ от генератора:`, JSON.stringify(response.data, null, 2));
        
        if (!response.data?.success) {
            throw new Error(response.data?.error || 'Ошибка генерации');
        }
        
        const schedule = response.data.schedule;
        if (!schedule || Object.keys(schedule).length === 0) {
            throw new Error('Расписание пустое');
        }
        
        console.log(`📊 Получено расписание для ${Object.keys(schedule).length} классов`);
        console.log(`📚 Всего уроков: ${response.data.totalLessons || 'неизвестно'}`);
        
        // Сохраняем в БД
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM lesson_schedule');
            
            let totalLessons = 0;
            const dayMap = { 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5 };
            
            for (const [className, days] of Object.entries(schedule)) {
                const classResult = await client.query(`SELECT id FROM classes WHERE CONCAT(number, letter) = $1`, [className]);
                if (classResult.rows.length === 0) {
                    console.log(`⚠️ Класс ${className} не найден`);
                    continue;
                }
                const classId = classResult.rows[0].id;
                
                for (const [dayName, lessons] of Object.entries(days)) {
                    const dayNumber = dayMap[dayName];
                    if (!dayNumber) continue;
                    
                    for (const lesson of lessons) {
                        const subjectResult = await client.query('SELECT id FROM lessons WHERE name = $1', [lesson.subject]);
                        if (subjectResult.rows.length === 0) {
                            console.log(`⚠️ Предмет "${lesson.subject}" не найден`);
                            continue;
                        }
                        const subjectId = subjectResult.rows[0].id;
                        
                        const nameParts = lesson.teacher.split(' ');
                        const teacherResult = await client.query(
                            'SELECT id FROM teachers WHERE last_name = $1 AND first_name LIKE $2',
                            [nameParts[0] || '', '%' + (nameParts[1] || '') + '%']
                        );
                        if (teacherResult.rows.length === 0) {
                            console.log(`⚠️ Учитель "${lesson.teacher}" не найден`);
                            continue;
                        }
                        const teacherId = teacherResult.rows[0].id;
                        
                        await client.query(`
                            INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `, [classId, subjectId, teacherId, dayNumber, lesson.lessonNumber, lesson.office]);
                        totalLessons++;
                    }
                }
            }
            
            await client.query('COMMIT');
            console.log(`✅ Сохранено ${totalLessons} уроков в БД`);
            
            res.json({ 
                success: true, 
                schedule: schedule,
                totalLessons: totalLessons,
                classesProcessed: Object.keys(schedule).length,
                message: `Расписание сгенерировано. ${totalLessons} уроков для ${Object.keys(schedule).length} классов`
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Ошибка при сохранении в БД:', err);
            throw err;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Ошибка генерации:', error);
        
        if (error.response) {
            console.error('Ответ сервера:', error.response.data);
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message,
            details: error.response?.data || error.toString()
        });
    }
});

module.exports = router;