// backend/routes/sanpin.js
const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const XLSX = require('xlsx');

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

// Получить данные СанПиН
router.get('/', async (req, res) => {
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

module.exports = router;