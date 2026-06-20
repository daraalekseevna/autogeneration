// backend/routes/sanpin.js
const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const XLSX = require('xlsx');

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============================================
// 1. САНПИН НАСТРОЙКИ (существующие эндпоинты)
// ============================================

// Получить данные СанПиН
router.get('/', async (req, res) => {
    // ... ваш существующий код
    try {
        let result = await db.query('SELECT * FROM sanpin_settings LIMIT 1');
        
        if (result.rows.length === 0) {
            return res.json({
                schoolName: '',
                schoolAddress: '',
                classroomArea: '',
                classroomLighting: '',
                classroomVentilation: '',
                desksType: '',
                desksHeight: '',
                boardType: '',
                maxLessonDuration: '45',
                minBreakDuration: '10',
                maxDailyLoad: '',
                maxWeeklyLoad: '',
                firstShiftStart: '08:00',
                secondShiftStart: '14:00',
                temperatureNorm: '18-24',
                humidityNorm: '40-60',
                medicalRoom: 'имеется',
                nurseSchedule: '',
                canteenType: 'столовая',
                mealSchedule: '',
                additionalNotes: ''
            });
        }
        
        const data = result.rows[0];
        res.json({
            schoolName: data.school_name || '',
            schoolAddress: data.school_address || '',
            classroomArea: data.classroom_area || '',
            classroomLighting: data.classroom_lighting || '',
            classroomVentilation: data.classroom_ventilation || '',
            desksType: data.desks_type || '',
            desksHeight: data.desks_height || '',
            boardType: data.board_type || '',
            maxLessonDuration: data.max_lesson_duration || '45',
            minBreakDuration: data.min_break_duration || '10',
            maxDailyLoad: data.max_daily_load || '',
            maxWeeklyLoad: data.max_weekly_load || '',
            firstShiftStart: data.first_shift_start || '08:00',
            secondShiftStart: data.second_shift_start || '14:00',
            temperatureNorm: data.temperature_norm || '18-24',
            humidityNorm: data.humidity_norm || '40-60',
            medicalRoom: data.medical_room || 'имеется',
            nurseSchedule: data.nurse_schedule || '',
            canteenType: data.canteen_type || 'столовая',
            mealSchedule: data.meal_schedule || '',
            additionalNotes: data.additional_notes || ''
        });
    } catch (err) {
        console.error('GET /sanpin error:', err);
        res.status(500).json({ message: 'Ошибка загрузки данных' });
    }
});

// Сохранить данные СанПиН
router.post('/', async (req, res) => {
    const data = req.body;
    
    try {
        await db.query('DELETE FROM sanpin_settings');
        
        await db.query(`
            INSERT INTO sanpin_settings (
                school_name, school_address,
                classroom_area, classroom_lighting, classroom_ventilation,
                desks_type, desks_height, board_type,
                max_lesson_duration, min_break_duration,
                max_daily_load, max_weekly_load,
                first_shift_start, second_shift_start,
                temperature_norm, humidity_norm,
                medical_room, nurse_schedule,
                canteen_type, meal_schedule,
                additional_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        `, [
            data.schoolName, data.schoolAddress,
            data.classroomArea, data.classroomLighting, data.classroomVentilation,
            data.desksType, data.desksHeight, data.boardType,
            data.maxLessonDuration, data.minBreakDuration,
            data.maxDailyLoad, data.maxWeeklyLoad,
            data.firstShiftStart, data.secondShiftStart,
            data.temperatureNorm, data.humidityNorm,
            data.medicalRoom, data.nurseSchedule,
            data.canteenType, data.mealSchedule,
            data.additionalNotes
        ]);
        
        res.json({ message: 'Данные сохранены' });
    } catch (err) {
        console.error('POST /sanpin error:', err);
        res.status(500).json({ message: 'Ошибка сохранения данных' });
    }
});

// Экспорт в Excel
router.get('/export', async (req, res) => {
    // ... ваш существующий код
    try {
        const result = await db.query('SELECT * FROM sanpin_settings LIMIT 1');
        const data = result.rows[0] || {};
        
        const wsData = [
            ['Параметр', 'Значение'],
            ['Наименование учреждения', data.school_name || ''],
            ['Адрес учреждения', data.school_address || ''],
            ['', ''],
            ['САНИТАРНЫЕ ТРЕБОВАНИЯ К ПОМЕЩЕНИЯМ', ''],
            ['Площадь класса на 1 ученика (м²)', data.classroom_area || ''],
            ['Освещенность (люкс)', data.classroom_lighting || ''],
            ['Температура воздуха (°C)', data.temperature_norm || ''],
            ['Влажность воздуха (%)', data.humidity_norm || ''],
            ['Вентиляция (кратность/час)', data.classroom_ventilation || ''],
            ['', ''],
            ['ТРЕБОВАНИЯ К ОБОРУДОВАНИЮ', ''],
            ['Тип парт', data.desks_type || ''],
            ['Ростовая группа парт', data.desks_height || ''],
            ['Тип досок', data.board_type || ''],
            ['', ''],
            ['ТРЕБОВАНИЯ К УЧЕБНОМУ ПРОЦЕССУ', ''],
            ['Максимальная длительность урока (мин)', data.max_lesson_duration || '45'],
            ['Минимальная длительность перемены (мин)', data.min_break_duration || '10'],
            ['Максимальная дневная нагрузка (уроков)', data.max_daily_load || ''],
            ['Максимальная недельная нагрузка (уроков)', data.max_weekly_load || ''],
            ['Начало 1 смены', data.first_shift_start || '08:00'],
            ['Начало 2 смены', data.second_shift_start || '14:00'],
            ['', ''],
            ['МЕДИЦИНСКОЕ ОБЕСПЕЧЕНИЕ', ''],
            ['Наличие медицинского кабинета', data.medical_room || ''],
            ['График работы медсестры', data.nurse_schedule || ''],
            ['', ''],
            ['ОРГАНИЗАЦИЯ ПИТАНИЯ', ''],
            ['Тип столовой', data.canteen_type || ''],
            ['График питания', data.meal_schedule || ''],
            ['', ''],
            ['ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ', ''],
            ['Примечания', data.additional_notes || '']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch: 40}, {wch: 50}];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'СанПиН');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sanpin_report.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('GET /sanpin/export error:', err);
        res.status(500).json({ message: 'Ошибка экспорта' });
    }
});

// ============================================
// 2. ПРАВИЛА СПАРИВАНИЯ (lesson_pairing_rules)
// ============================================

// Получить все правила спаривания
router.get('/lesson-pairing-rules', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                lpr.*,
                c.number || c.letter as class_name,
                t.name as teacher_name,
                l1.name as subject_name_1,
                l2.name as subject_name_2
            FROM lesson_pairing_rules lpr
            LEFT JOIN classes c ON lpr.class_id = c.id
            LEFT JOIN teachers t ON lpr.teacher_id = t.id
            LEFT JOIN lessons l1 ON lpr.subject_id_1 = l1.id
            LEFT JOIN lessons l2 ON lpr.subject_id_2 = l2.id
            ORDER BY lpr.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('GET /lesson-pairing-rules error:', error);
        res.status(500).json({ error: 'Ошибка загрузки правил спаривания' });
    }
});

// Создать правило спаривания
router.post('/lesson-pairing-rules', async (req, res) => {
    try {
        const { class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2 } = req.body;
        
        // Проверка обязательных полей
        if (!class_id || !subject_id_1 || !subject_id_2) {
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }
        
        const result = await db.query(
            `INSERT INTO lesson_pairing_rules 
             (class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [class_id, teacher_id || null, subject_id_1, subject_id_2, mandatory || false, day_of_week || null, lesson_slot1 || null, lesson_slot2 || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('POST /lesson-pairing-rules error:', error);
        res.status(500).json({ error: 'Ошибка создания правила спаривания' });
    }
});

// Обновить правило спаривания
router.put('/lesson-pairing-rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2 } = req.body;
        
        const result = await db.query(
            `UPDATE lesson_pairing_rules 
             SET class_id = $1, teacher_id = $2, subject_id_1 = $3, subject_id_2 = $4, 
                 mandatory = $5, day_of_week = $6, lesson_slot1 = $7, lesson_slot2 = $8,
                 updated_at = NOW()
             WHERE id = $9 
             RETURNING *`,
            [class_id, teacher_id || null, subject_id_1, subject_id_2, mandatory || false, day_of_week || null, lesson_slot1 || null, lesson_slot2 || null, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Правило не найдено' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('PUT /lesson-pairing-rules/:id error:', error);
        res.status(500).json({ error: 'Ошибка обновления правила спаривания' });
    }
});

// Удалить правило спаривания
router.delete('/lesson-pairing-rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM lesson_pairing_rules WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Правило не найдено' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('DELETE /lesson-pairing-rules/:id error:', error);
        res.status(500).json({ error: 'Ошибка удаления правила спаривания' });
    }
});

// ============================================
// 3. ГРУППОВЫЕ ЗАНЯТИЯ (group_division_links)
// ============================================

// Получить все групповые связи
router.get('/group-division-links', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                gdl.*,
                c.number || c.letter as class_name,
                array_agg(DISTINCT t.name) as teacher_names,
                array_agg(DISTINCT r.number) as room_numbers
            FROM group_division_links gdl
            LEFT JOIN classes c ON gdl.class_id = c.id
            LEFT JOIN teachers t ON t.id = ANY(SELECT jsonb_array_elements_text(gdl.teacher_pair)::int)
            LEFT JOIN rooms r ON r.id = ANY(SELECT jsonb_array_elements_text(gdl.room_ids)::int)
            GROUP BY gdl.id, c.number, c.letter
            ORDER BY gdl.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('GET /group-division-links error:', error);
        res.status(500).json({ error: 'Ошибка загрузки групповых занятий' });
    }
});

// Создать групповую связь
router.post('/group-division-links', async (req, res) => {
    try {
        const { class_id, teacher_pair, room_ids, day_of_week, start_slot } = req.body;
        
        // Проверка обязательных полей
        if (!class_id || !teacher_pair || !room_ids || !day_of_week || !start_slot) {
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }
        
        // Проверка что выбрано 2 учителя и 2 кабинета
        if (teacher_pair.length !== 2 || room_ids.length !== 2) {
            return res.status(400).json({ error: 'Должно быть выбрано 2 учителя и 2 кабинета' });
        }
        
        const result = await db.query(
            `INSERT INTO group_division_links 
             (class_id, teacher_pair, room_ids, day_of_week, start_slot) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [class_id, JSON.stringify(teacher_pair), JSON.stringify(room_ids), day_of_week, start_slot]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('POST /group-division-links error:', error);
        res.status(500).json({ error: 'Ошибка создания групповой связи' });
    }
});

// Обновить групповую связь
router.put('/group-division-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { class_id, teacher_pair, room_ids, day_of_week, start_slot } = req.body;
        
        const result = await db.query(
            `UPDATE group_division_links 
             SET class_id = $1, teacher_pair = $2, room_ids = $3, day_of_week = $4, start_slot = $5
             WHERE id = $6 
             RETURNING *`,
            [class_id, JSON.stringify(teacher_pair), JSON.stringify(room_ids), day_of_week, start_slot, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Связь не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('PUT /group-division-links/:id error:', error);
        res.status(500).json({ error: 'Ошибка обновления групповой связи' });
    }
});

// Удалить групповую связь
router.delete('/group-division-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM group_division_links WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Связь не найдена' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('DELETE /group-division-links/:id error:', error);
        res.status(500).json({ error: 'Ошибка удаления групповой связи' });
    }
});

// ============================================
// 4. СИНХРОНИЗАЦИЯ ПАРАЛЛЕЛЕЙ (class_parallel_sync)
// ============================================

// Получить все синхронизации
router.get('/class-parallel-sync', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                cps.*,
                l.name as subject_name
            FROM class_parallel_sync cps
            LEFT JOIN lessons l ON cps.subject_id = l.id
            ORDER BY cps.grade, cps.subject_id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('GET /class-parallel-sync error:', error);
        res.status(500).json({ error: 'Ошибка загрузки синхронизаций' });
    }
});

// Создать синхронизацию
router.post('/class-parallel-sync', async (req, res) => {
    try {
        const { grade, subject_id, same_day_required } = req.body;
        
        if (!grade || !subject_id) {
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }
        
        const result = await db.query(
            `INSERT INTO class_parallel_sync (grade, subject_id, same_day_required) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (grade, subject_id) DO UPDATE SET same_day_required = $3
             RETURNING *`,
            [grade, subject_id, same_day_required !== undefined ? same_day_required : true]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('POST /class-parallel-sync error:', error);
        res.status(500).json({ error: 'Ошибка создания синхронизации' });
    }
});

// Удалить синхронизацию
router.delete('/class-parallel-sync/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM class_parallel_sync WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Синхронизация не найдена' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('DELETE /class-parallel-sync/:id error:', error);
        res.status(500).json({ error: 'Ошибка удаления синхронизации' });
    }
});

// ============================================
// 5. ЗАПРЕЩЁННЫЕ ПОСЛЕДОВАТЕЛЬНОСТИ (forbidden_sequences)
// ============================================

// Получить все запрещённые последовательности
router.get('/forbidden-sequences', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM forbidden_sequences ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('GET /forbidden-sequences error:', error);
        res.status(500).json({ error: 'Ошибка загрузки запрещённых последовательностей' });
    }
});

// Создать запрещённую последовательность
router.post('/forbidden-sequences', async (req, res) => {
    try {
        const { sequence_type, param1, param2, severity } = req.body;
        
        if (!sequence_type) {
            return res.status(400).json({ error: 'Тип последовательности обязателен' });
        }
        
        const result = await db.query(
            `INSERT INTO forbidden_sequences (sequence_type, param1, param2, severity) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [sequence_type, param1 || null, param2 || null, severity || 'error']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('POST /forbidden-sequences error:', error);
        res.status(500).json({ error: 'Ошибка создания запрещённой последовательности' });
    }
});

// Обновить запрещённую последовательность
router.put('/forbidden-sequences/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { sequence_type, param1, param2, severity } = req.body;
        
        const result = await db.query(
            `UPDATE forbidden_sequences 
             SET sequence_type = $1, param1 = $2, param2 = $3, severity = $4
             WHERE id = $5 
             RETURNING *`,
            [sequence_type, param1 || null, param2 || null, severity || 'error', id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Последовательность не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('PUT /forbidden-sequences/:id error:', error);
        res.status(500).json({ error: 'Ошибка обновления запрещённой последовательности' });
    }
});

// Удалить запрещённую последовательность
router.delete('/forbidden-sequences/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM forbidden_sequences WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Последовательность не найдена' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('DELETE /forbidden-sequences/:id error:', error);
        res.status(500).json({ error: 'Ошибка удаления запрещённой последовательности' });
    }
});

module.exports = router;