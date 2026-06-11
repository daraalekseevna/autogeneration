const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('./activity');
const router = express.Router();

router.get('/my-class', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-class called ===');
        
        const teacherResult = await db.query(
            'SELECT id, first_name, last_name, middle_name, color FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ hasClass: false, message: 'Учитель не найден' });
        }
        
        const teacher = teacherResult.rows[0];
        console.log('Teacher found:', teacher.id, 'Color:', teacher.color);
        
        const classResult = await db.query(
            `SELECT c.id, c.number, c.letter, c.shift,
                    COUNT(s.id) as students_count
             FROM classes c
             LEFT JOIN students s ON s.class_id = c.id
             WHERE c.teacher_id = $1
             GROUP BY c.id`,
            [teacher.id]
        );
        
        if (classResult.rows.length === 0) {
            return res.json({ hasClass: false, message: 'Вы не назначены классным руководителем' });
        }
        
        const classData = classResult.rows[0];
        
        res.json({
            hasClass: true,
            classData: {
                id: classData.id,
                name: `${classData.number}${classData.letter}`,
                number: classData.number,
                letter: classData.letter,
                shift: classData.shift,
                classroom: 'не указан',
                studentsCount: parseInt(classData.students_count) || 0,
                teacherName: `${teacher.last_name} ${teacher.first_name} ${teacher.middle_name || ''}`.trim(),
                teacherColor: teacher.color || '#3b82f6'  // Добавляем цвет учителя
            }
        });
        
    } catch (err) {
        console.error('Error in /my-class:', err);
        res.status(500).json({ message: err.message });
    }
});

// ИСПРАВЛЕННЫЙ ЭНДПОИНТ /my-schedule с цветом учителя
router.get('/my-schedule', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-schedule called ===');
        
        // Получаем учителя и ЕГО ЦВЕТ из БД
        const teacherResult = await db.query(
            'SELECT id, color FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            console.log('Teacher not found for user_id:', req.user.id);
            return res.json({ schedule: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        const teacherColor = teacherResult.rows[0].color || '#3b82f6';  // ← Берем цвет из БД
        
        console.log('Teacher ID:', teacherId, 'Color from DB:', teacherColor);
        
        const scheduleResult = await db.query(
            `SELECT ls.day_of_week, ls.lesson_number, ls.room,
                    l.name as subject_name,
                    c.number as class_number, c.letter as class_letter,
                    t.last_name, t.first_name, t.middle_name
             FROM lesson_schedule ls
             JOIN lessons l ON ls.subject_id = l.id
             JOIN classes c ON ls.class_id = c.id
             JOIN teachers t ON ls.teacher_id = t.id
             WHERE ls.teacher_id = $1
             ORDER BY ls.day_of_week, ls.lesson_number`,
            [teacherId]
        );
        
        console.log('Schedule results count:', scheduleResult.rows.length);
        
        const daysMap = {
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
        
        scheduleResult.rows.forEach(lesson => {
            const dayName = daysMap[lesson.day_of_week];
            if (dayName) {
                schedule[dayName].push({
                    number: lesson.lesson_number,
                    subject: lesson.subject_name,
                    className: `${lesson.class_number}${lesson.class_letter}`,
                    room: lesson.room || '—',
                    teacherName: `${lesson.last_name} ${lesson.first_name.charAt(0)}.${lesson.middle_name ? lesson.middle_name.charAt(0) + '.' : ''}`,
                    color: teacherColor,  // ← ДОБАВЛЯЕМ ЦВЕТ УЧИТЕЛЯ
                    teacherColor: teacherColor  // ← ДУБЛИРУЕМ ДЛЯ НАДЕЖНОСТИ
                });
            }
        });
        
        Object.keys(schedule).forEach(day => {
            schedule[day].sort((a, b) => a.number - b.number);
        });
        
        console.log('Schedule prepared, first lesson color:', schedule['Понедельник'][0]?.color);
        res.json({ schedule });
        
    } catch (err) {
        console.error('Error getting teacher schedule:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

router.get('/my-extracurricular', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-extracurricular called ===');
        
        // Получаем учителя
        const teacherResult = await db.query(
            'SELECT id, color FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            console.log('Teacher not found');
            return res.json({ activities: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        const teacherColor = teacherResult.rows[0].color || '#ffa502';
        
        console.log('Teacher ID:', teacherId);
        
        // Получаем дополнительные занятия для учителя по teacher_id
        const activitiesResult = await db.query(`
            SELECT 
                id, 
                title, 
                days, 
                start_time, 
                end_time, 
                room, 
                description
            FROM extracurricular_activities
            WHERE teacher_id = $1
            ORDER BY id
        `, [teacherId]);
        
        console.log('Activities found:', activitiesResult.rows.length);
        
        if (activitiesResult.rows.length === 0) {
            console.log('No activities for teacher ID:', teacherId);
            return res.json({ activities: {} });
        }
        
        const daysArray = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        
        const activities = {};
        daysArray.forEach(day => { activities[day] = []; });
        
        activitiesResult.rows.forEach(act => {
            console.log('Processing activity:', act.id, act.title);
            console.log('Type of days:', typeof act.days);
            console.log('Days value:', act.days);
            
            // Обработка days - может быть строкой или массивом
            let daysList = [];
            
            if (Array.isArray(act.days)) {
                // Уже массив
                daysList = act.days;
                console.log('Days is array:', daysList);
            } else if (typeof act.days === 'string') {
                // Строка, возможно с скобками
                let daysStr = act.days;
                // Удаляем скобки если есть
                daysStr = daysStr.replace(/[()]/g, '');
                daysList = daysStr.split(',').map(d => d.trim());
                console.log('Parsed from string:', daysList);
            } else if (act.days && typeof act.days === 'object') {
                // Если это объект PostgreSQL array
                daysList = act.days;
                console.log('PostgreSQL array:', daysList);
            }
            
            // Добавляем занятие в каждый день недели
            daysList.forEach(dayName => {
                // Нормализуем название дня
                let normalizedDay = dayName;
                if (dayName === 'ПН' || dayName === 'Пн') normalizedDay = 'Понедельник';
                if (dayName === 'ВТ' || dayName === 'Вт') normalizedDay = 'Вторник';
                if (dayName === 'СР' || dayName === 'Ср') normalizedDay = 'Среда';
                if (dayName === 'ЧТ' || dayName === 'Чт') normalizedDay = 'Четверг';
                if (dayName === 'ПТ' || dayName === 'Пт') normalizedDay = 'Пятница';
                if (dayName === 'СБ' || dayName === 'Сб') normalizedDay = 'Суббота';
                
                if (activities[normalizedDay]) {
                    activities[normalizedDay].push({
                        id: act.id,
                        name: act.title,
                        startTime: act.start_time,
                        endTime: act.end_time,
                        room: act.room || '—',
                        description: act.description || '',
                        color: teacherColor
                    });
                }
            });
        });
        
        // Сортируем занятия по времени
        daysArray.forEach(day => {
            activities[day].sort((a, b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            });
        });
        
        console.log('Final activities counts:', daysArray.map(day => ({
            day,
            count: activities[day].length
        })));
        
        res.json({ activities });
        
    } catch (err) {
        console.error('Error getting extracurricular activities:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});
router.get('/my-class/schedule', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-class/schedule called ===');
        
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ schedule: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        const classResult = await db.query(
            'SELECT id, number, letter FROM classes WHERE teacher_id = $1',
            [teacherId]
        );
        
        if (classResult.rows.length === 0) {
            return res.json({ schedule: {} });
        }
        
        const classData = classResult.rows[0];
        console.log('Class found:', classData.number, classData.letter);
        
        const scheduleResult = await db.query(
            `SELECT ls.day_of_week, ls.lesson_number, ls.room, 
                    l.name as subject_name,
                    t.last_name, t.first_name, t.middle_name,
                    t.color as teacher_color
             FROM lesson_schedule ls
             JOIN lessons l ON ls.subject_id = l.id
             JOIN teachers t ON ls.teacher_id = t.id
             WHERE ls.class_id = $1
             ORDER BY ls.day_of_week, ls.lesson_number`,
            [classData.id]
        );
        
        const daysMap = {
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
        
        scheduleResult.rows.forEach(lesson => {
            const dayName = daysMap[lesson.day_of_week];
            if (dayName) {
                schedule[dayName].push({
                    number: lesson.lesson_number,
                    subject: lesson.subject_name,
                    teacher: `${lesson.last_name} ${lesson.first_name.charAt(0)}.${lesson.middle_name ? lesson.middle_name.charAt(0) + '.' : ''}`,
                    room: lesson.room || '—',
                    color: lesson.teacher_color || '#3b82f6'
                });
            }
        });
        
        Object.keys(schedule).forEach(day => {
            schedule[day].sort((a, b) => a.number - b.number);
        });
        
        res.json({ schedule });
        
    } catch (err) {
        console.error('Error getting class schedule:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/my-class/students', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-class/students called ===');
        
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ students: [] });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        const classResult = await db.query(
            'SELECT id FROM classes WHERE teacher_id = $1',
            [teacherId]
        );
        
        if (classResult.rows.length === 0) {
            return res.json({ students: [] });
        }
        
        const classId = classResult.rows[0].id;
        
        const studentsResult = await db.query(
            `SELECT id, last_name, first_name, middle_name, birth_date 
             FROM students 
             WHERE class_id = $1
             ORDER BY last_name, first_name`,
            [classId]
        );
        
        const students = studentsResult.rows.map(s => ({
            id: s.id,
            fullName: `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.trim(),
            lastName: s.last_name,
            firstName: s.first_name,
            middleName: s.middle_name || '',
            birthDate: s.birth_date ? new Date(s.birth_date).toLocaleDateString('ru-RU') : '—'
        }));
        
        res.json({ students, count: students.length });
        
    } catch (err) {
        console.error('Error getting students:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/my-info', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.id, t.last_name, t.first_name, t.middle_name, t.color,
                    CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as full_name
             FROM teachers t
             WHERE t.user_id = $1`,
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        res.json({
            id: result.rows[0].id,
            lastName: result.rows[0].last_name,
            firstName: result.rows[0].first_name,
            middleName: result.rows[0].middle_name,
            fullName: result.rows[0].full_name,
            color: result.rows[0].color || '#3b82f6'
        });
    } catch (err) {
        console.error('Error getting teacher info:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;