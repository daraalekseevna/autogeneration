// backend/routes/scheduleGenerator.js
const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============= УПРАВЛЕНИЕ ТРУДНОСТЬЮ ПРЕДМЕТОВ =============

// Получить все настройки трудности
router.get('/subject-difficulty', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, grade, subject_name, difficulty_rank, subject_type
            FROM subject_difficulty
            ORDER BY grade, subject_name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /subject-difficulty error:', err);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// Получить трудность для конкретного класса
router.get('/subject-difficulty/:grade', async (req, res) => {
    const { grade } = req.params;
    try {
        const result = await db.query(`
            SELECT subject_name, difficulty_rank, subject_type
            FROM subject_difficulty
            WHERE grade = $1
            ORDER BY subject_name
        `, [grade]);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /subject-difficulty/:grade error:', err);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// Добавить или обновить трудность предмета
router.post('/subject-difficulty', async (req, res) => {
    const { grade, subjectName, difficultyRank, subjectType } = req.body;
    
    if (!grade || !subjectName || !difficultyRank) {
        return res.status(400).json({ message: 'Не все поля заполнены' });
    }
    
    try {
        await db.query(`
            INSERT INTO subject_difficulty (grade, subject_name, difficulty_rank, subject_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (grade, subject_name) 
            DO UPDATE SET difficulty_rank = $3, subject_type = $4
        `, [grade, subjectName, difficultyRank, subjectType || 'нейтральный']);
        
        res.json({ message: 'Данные сохранены' });
    } catch (err) {
        console.error('POST /subject-difficulty error:', err);
        res.status(500).json({ message: 'Ошибка сохранения' });
    }
});

// Удалить запись о трудности
router.delete('/subject-difficulty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM subject_difficulty WHERE id = $1', [id]);
        res.json({ message: 'Запись удалена' });
    } catch (err) {
        console.error('DELETE /subject-difficulty error:', err);
        res.status(500).json({ message: 'Ошибка удаления' });
    }
});

// ============= УПРАВЛЕНИЕ ДНЕВНЫМИ ЛИМИТАМИ =============

// Получить все дневные лимиты
router.get('/daily-limits', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, grade, day_name, min_weight, max_weight
            FROM daily_load_limits
            ORDER BY grade, 
                CASE day_name
                    WHEN 'Понедельник' THEN 1
                    WHEN 'Вторник' THEN 2
                    WHEN 'Среда' THEN 3
                    WHEN 'Четверг' THEN 4
                    WHEN 'Пятница' THEN 5
                END
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /daily-limits error:', err);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// Добавить или обновить дневной лимит
router.post('/daily-limits', async (req, res) => {
    const { grade, dayName, minWeight, maxWeight } = req.body;
    
    if (!grade || !dayName || minWeight === undefined || maxWeight === undefined) {
        return res.status(400).json({ message: 'Не все поля заполнены' });
    }
    
    try {
        await db.query(`
            INSERT INTO daily_load_limits (grade, day_name, min_weight, max_weight)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (grade, day_name) 
            DO UPDATE SET min_weight = $3, max_weight = $4
        `, [grade, dayName, minWeight, maxWeight]);
        
        res.json({ message: 'Данные сохранены' });
    } catch (err) {
        console.error('POST /daily-limits error:', err);
        res.status(500).json({ message: 'Ошибка сохранения' });
    }
});

// ============= УПРАВЛЕНИЕ НЕДЕЛЬНЫМИ ЛИМИТАМИ =============

// Получить все недельные лимиты
router.get('/weekly-limits', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, grade, week_weight, month_weight
            FROM weekly_load_limits
            ORDER BY grade
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /weekly-limits error:', err);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// Добавить или обновить недельный лимит
router.post('/weekly-limits', async (req, res) => {
    const { grade, weekWeight, monthWeight } = req.body;
    
    if (!grade || weekWeight === undefined) {
        return res.status(400).json({ message: 'Не все поля заполнены' });
    }
    
    try {
        await db.query(`
            INSERT INTO weekly_load_limits (grade, week_weight, month_weight)
            VALUES ($1, $2, $3)
            ON CONFLICT (grade) 
            DO UPDATE SET week_weight = $2, month_weight = $3
        `, [grade, weekWeight, monthWeight || weekWeight]);
        
        res.json({ message: 'Данные сохранены' });
    } catch (err) {
        console.error('POST /weekly-limits error:', err);
        res.status(500).json({ message: 'Ошибка сохранения' });
    }
});

// ============= ЗАПУСК ГЕНЕРАЦИИ =============

// Запустить генерацию расписания
router.post('/generate', async (req, res) => {
    try {
        // Здесь будет вызов C# генератора
        // Пока возвращаем заглушку
        res.json({ message: 'Генерация запущена', status: 'processing' });
    } catch (err) {
        console.error('POST /generate error:', err);
        res.status(500).json({ message: 'Ошибка генерации' });
    }
});

// Получить сгенерированное расписание
router.get('/schedule', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT class_name, day_name, lesson_number, subject_name, teacher_name, office_number
            FROM generated_schedule
            ORDER BY 
                CASE class_name WHEN '1А' THEN 1 END,
                CASE day_name
                    WHEN 'Понедельник' THEN 1
                    WHEN 'Вторник' THEN 2
                    WHEN 'Среда' THEN 3
                    WHEN 'Четверг' THEN 4
                    WHEN 'Пятница' THEN 5
                END,
                lesson_number
        `);
        
        // Группируем по классам
        const schedules = {};
        for (const row of result.rows) {
            if (!schedules[row.class_name]) {
                schedules[row.class_name] = {};
            }
            if (!schedules[row.class_name][row.day_name]) {
                schedules[row.class_name][row.day_name] = [];
            }
            schedules[row.class_name][row.day_name].push({
                lessonNumber: row.lesson_number,
                subject: row.subject_name,
                teacher: row.teacher_name,
                office: row.office_number
            });
        }
        
        res.json({ schedules });
    } catch (err) {
        console.error('GET /schedule error:', err);
        res.status(500).json({ message: 'Ошибка загрузки расписания' });
    }
});

// Сохранить сгенерированное расписание
router.post('/schedule', async (req, res) => {
    const { schedules } = req.body;
    
    try {
        await db.query('BEGIN');
        
        // Очищаем старые данные
        await db.query('TRUNCATE generated_schedule');
        
        // Сохраняем новые
        for (const className of Object.keys(schedules)) {
            const days = schedules[className];
            for (const dayName of Object.keys(days)) {
                const lessons = days[dayName];
                for (const lesson of lessons) {
                    await db.query(`
                        INSERT INTO generated_schedule (class_name, day_name, lesson_number, subject_name, teacher_name, office_number)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [className, dayName, lesson.lessonNumber, lesson.subject, lesson.teacher, lesson.office]);
                }
            }
        }
        
        await db.query('COMMIT');
        res.json({ message: 'Расписание сохранено' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('POST /schedule error:', err);
        res.status(500).json({ message: 'Ошибка сохранения расписания' });
    }
});

module.exports = router;