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

// ============================================================
// ⚡ ГЕНЕРАЦИЯ РАСПИСАНИЯ
// ============================================================

router.post('/generate-schedule', async (req, res) => {
    console.log('\n🚀 ========== ЗАПУСК ГЕНЕРАЦИИ ==========\n');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Нет токена' });
    }

    req.setTimeout(900000);

    try {
        const generatorUrl = process.env.GENERATOR_URL || process.env.SCHEDULE_GENERATOR_URL || 'https://schedule-generator-j794.onrender.com';
        
        console.log(`🔍 Проверка доступности C# генератора на ${generatorUrl}...`);
        
        let useLocalGeneration = false;
        try {
            await axios.get(`${generatorUrl}/`, { timeout: 5000 });
            console.log('✅ C# генератор доступен');
        } catch (healthError) {
            console.log('❌ C# генератор НЕ доступен');
            useLocalGeneration = true;
        }
        
        let schedule = null;
        let totalLessons = 0;
        let classesProcessed = 0;
        let generationMessage = '';
        
        if (useLocalGeneration) {
            console.log('🔄 Используем локальную генерацию...');
            const localResult = await generateLocalSchedule();
            if (localResult && localResult.schedule) {
                schedule = localResult.schedule;
                totalLessons = localResult.totalLessons;
                classesProcessed = localResult.classesProcessed;
                generationMessage = 'Расписание сгенерировано локально (C# недоступен)';
            } else {
                throw new Error('Не удалось сгенерировать расписание локально');
            }
        } else {
            console.log('📡 Отправка запроса к C# генератору...');
            
            try {
                const rulesUrl = `${req.protocol}://${req.get('host')}/api/admin/generation-rules`;
                console.log(`📋 URL правил: ${rulesUrl}`);
                
                const response = await axios.post(`${generatorUrl}/api/generate`, {
                    rulesUrl: rulesUrl,
                    token: token
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 900000
                });
                
                if (!response.data?.success) {
                    throw new Error(response.data?.error || 'Ошибка генерации');
                }
                
                schedule = response.data.schedule;
                if (!schedule || Object.keys(schedule).length === 0) {
                    throw new Error('Расписание пустое');
                }
                
                totalLessons = Object.values(schedule).reduce((acc, days) => {
                    let count = 0;
                    for (const lessons of Object.values(days)) {
                        count += lessons.length;
                    }
                    return acc + count;
                }, 0);
                classesProcessed = Object.keys(schedule).length;
                generationMessage = 'Расписание сгенерировано C# генератором';
                
            } catch (genError) {
                console.error('❌ Ошибка C# генератора:', genError.message);
                console.log('🔄 Пробуем локальную генерацию...');
                const localResult = await generateLocalSchedule();
                if (localResult && localResult.schedule) {
                    schedule = localResult.schedule;
                    totalLessons = localResult.totalLessons;
                    classesProcessed = localResult.classesProcessed;
                    generationMessage = 'Расписание сгенерировано локально (ошибка C#)';
                } else {
                    throw new Error('Не удалось сгенерировать расписание');
                }
            }
        }
        
        if (!schedule || Object.keys(schedule).length === 0) {
            throw new Error('Расписание пустое');
        }
        
        console.log(`📊 Получено расписание для ${classesProcessed} классов, ${totalLessons} уроков`);
        
        console.log('💾 Сохранение в БД...');
        const saved = await saveScheduleToDB(schedule);
        
        console.log(`✅ Готово! Сохранено ${saved.totalLessons} уроков`);
        
        res.json({ 
            success: true, 
            schedule: schedule,
            totalLessons: saved.totalLessons,
            classesProcessed: saved.classesProcessed,
            message: `${generationMessage}. ${saved.totalLessons} уроков для ${saved.classesProcessed} классов`
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации:', error);
        
        try {
            console.log('🔄 Последняя попытка - локальная генерация...');
            const localResult = await generateLocalSchedule();
            if (localResult && localResult.schedule && Object.keys(localResult.schedule).length > 0) {
                const saved = await saveScheduleToDB(localResult.schedule);
                return res.json({
                    success: true,
                    schedule: localResult.schedule,
                    totalLessons: saved.totalLessons,
                    classesProcessed: saved.classesProcessed,
                    message: `Расписание сгенерировано локально. ${saved.totalLessons} уроков.`
                });
            }
        } catch (localErr) {
            console.error('❌ Локальная генерация не удалась:', localErr);
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Ошибка генерации расписания'
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
        const dayMap = { 
            'Понедельник': 1, 
            'Вторник': 2, 
            'Среда': 3, 
            'Четверг': 4, 
            'Пятница': 5, 
            'Суббота': 6 
        };
        const classesProcessed = new Set();
        
        console.log('📝 Начинаем сохранение расписания...');
        console.log('📋 Классы в расписании:', Object.keys(schedule));
        
        // ✅ Получаем все классы из БД
        const allClasses = await client.query('SELECT id, CONCAT(number, letter) as name, number, letter FROM classes');
        console.log('📋 Классы в БД:', allClasses.rows.map(r => r.name));
        
        const classMap = {};
        for (const cls of allClasses.rows) {
            classMap[cls.name] = cls.id;
            classMap[cls.name.toLowerCase()] = cls.id;
            // Добавляем с пробелом
            classMap[`${cls.name} класс`] = cls.id;
        }
        
        for (const [className, days] of Object.entries(schedule)) {
            console.log(`📝 Обработка класса: "${className}"`);
            
            let classId = null;
            const cleanName = className.replace(/\s/g, '');
            
            // Пробуем найти класс
            if (classMap[className]) {
                classId = classMap[className];
            } else if (classMap[cleanName]) {
                classId = classMap[cleanName];
            } else if (classMap[className.toLowerCase()]) {
                classId = classMap[className.toLowerCase()];
            } else if (classMap[`${className} класс`]) {
                classId = classMap[`${className} класс`];
            }
            
            // Если не нашли — пробуем по номеру и букве
            if (!classId) {
                const match = className.match(/^(\d+)([А-ЯA-Z])/);
                if (match) {
                    const number = parseInt(match[1]);
                    const letter = match[2].toUpperCase();
                    for (const cls of allClasses.rows) {
                        if (cls.number === number && cls.letter === letter) {
                            classId = cls.id;
                            break;
                        }
                    }
                }
            }
            
            if (!classId) {
                console.log(`⚠️ Класс "${className}" не найден в БД!`);
                console.log(`📋 Доступные классы:`, allClasses.rows.map(r => r.name).join(', '));
                continue;
            }
            
            console.log(`✅ Найден класс: ${className} -> id: ${classId}`);
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
                
                console.log(`   📚 ${dayName}: ${lessons.length} уроков`);
                
                for (const lesson of lessons) {
                    const subjectName = lesson.subject || lesson.Subject;
                    const teacherName = lesson.teacher || lesson.Teacher;
                    const room = lesson.office || lesson.Room || lesson.office || lesson.room || '';
                    const lessonNumber = lesson.lessonNumber || lesson.LessonNumber || 1;
                    
                    if (!subjectName) {
                        console.log(`   ⚠️ Нет названия предмета`);
                        continue;
                    }
                    
                    const subjectResult = await client.query(
                        'SELECT id FROM lessons WHERE LOWER(name) = LOWER($1) OR LOWER(short_name) = LOWER($1)',
                        [subjectName]
                    );
                    if (subjectResult.rows.length === 0) {
                        console.log(`   ⚠️ Предмет "${subjectName}" не найден`);
                        continue;
                    }
                    const subjectId = subjectResult.rows[0].id;
                    
                    let teacherId = null;
                    if (teacherName && teacherName.trim()) {
                        const nameParts = teacherName.trim().split(/\s+/);
                        if (nameParts.length >= 1) {
                            const lastName = nameParts[0];
                            const firstName = nameParts.length > 1 ? nameParts[1] : '';
                            
                            let query = 'SELECT id FROM teachers WHERE last_name ILIKE $1';
                            let params = [lastName + '%'];
                            
                            if (firstName) {
                                query += ' AND first_name ILIKE $2';
                                params.push(firstName + '%');
                            }
                            
                            let teacherResult = await client.query(query, params);
                            
                            if (teacherResult.rows.length === 0 && firstName) {
                                teacherResult = await client.query(
                                    'SELECT id FROM teachers WHERE CONCAT(last_name, \' \', first_name) ILIKE $1',
                                    [`%${teacherName}%`]
                                );
                            }
                            
                            if (teacherResult.rows.length > 0) {
                                teacherId = teacherResult.rows[0].id;
                            }
                        }
                    }
                    
                    if (!teacherId) {
                        console.log(`   ⚠️ Учитель "${teacherName}" не найден`);
                        continue;
                    }
                    
                    await client.query(`
                        INSERT INTO lesson_schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, room)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [classId, subjectId, teacherId, dayNumber, lessonNumber, room || '']);
                    totalLessons++;
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Сохранено ${totalLessons} уроков в БД для ${classesProcessed.size} классов`);
        
        return { totalLessons, classesProcessed: classesProcessed.size };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка сохранения в БД:', err);
        throw err;
    } finally {
        client.release();
    }
}

async function generateLocalSchedule() {
    console.log('🔄 Генерация локального расписания...');
    
    const classes = await db.query('SELECT id, CONCAT(number, letter) as name, number, letter FROM classes');
    const lessons = await db.query('SELECT id, name FROM lessons');
    const teachers = await db.query('SELECT id, last_name, first_name FROM teachers');
    
    if (classes.rows.length === 0) {
        console.log('❌ Нет классов в БД');
        return null;
    }
    if (lessons.rows.length === 0) {
        console.log('❌ Нет предметов в БД');
        return null;
    }
    if (teachers.rows.length === 0) {
        console.log('❌ Нет учителей в БД');
        return null;
    }
    
    console.log(`📋 Найдено: ${classes.rows.length} классов, ${lessons.rows.length} предметов, ${teachers.rows.length} учителей`);
    
    const schedule = {};
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    let totalLessons = 0;
    let classesProcessed = 0;
    
    for (const cls of classes.rows) {
        schedule[cls.name] = {};
        classesProcessed++;
        
        const maxLessons = Math.min(4 + Math.floor(Math.random() * 3), lessons.rows.length);
        
        for (const day of days) {
            schedule[cls.name][day] = [];
            
            const shuffledLessons = [...lessons.rows].sort(() => Math.random() - 0.5);
            const numLessons = Math.min(maxLessons, shuffledLessons.length);
            
            for (let i = 0; i < numLessons; i++) {
                const teacher = teachers.rows[i % teachers.rows.length];
                const lessonData = {
                    subject: shuffledLessons[i].name,
                    teacher: `${teacher.last_name} ${teacher.first_name}`,
                    office: `${100 + Math.floor(Math.random() * 50)}`,
                    lessonNumber: i + 1
                };
                schedule[cls.name][day].push(lessonData);
                totalLessons++;
            }
        }
    }
    
    console.log(`✅ Сгенерировано ${totalLessons} уроков для ${classesProcessed} классов`);
    
    return { schedule, totalLessons, classesProcessed };
}

module.exports = router;