const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Получить класс, которым руководит учитель
router.get('/my-class', authenticateToken, async (req, res) => {
    try {
        const teacherResult = await db.query(
            'SELECT id, first_name, last_name, middle_name FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ hasClass: false, message: 'Учитель не найден' });
        }
        
        const teacher = teacherResult.rows[0];
        
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
                teacherName: `${teacher.last_name} ${teacher.first_name} ${teacher.middle_name || ''}`.trim()
            }
        });
        
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Получить расписание учителя (уроки)
router.get('/my-schedule', authenticateToken, async (req, res) => {
    try {
        // Находим учителя по user_id
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ schedule: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        // Получаем расписание уроков учителя
        const scheduleResult = await db.query(
            `SELECT ls.day_of_week, ls.lesson_number, ls.room,
                    s.name as subject_name,
                    c.number as class_number, c.letter as class_letter
             FROM lesson_schedule ls
             JOIN subjects s ON ls.subject_id = s.id
             JOIN classes c ON ls.class_id = c.id
             WHERE ls.teacher_id = $1
             ORDER BY ls.day_of_week, ls.lesson_number`,
            [teacherId]
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
                    className: `${lesson.class_number}${lesson.class_letter}`,
                    room: lesson.room || '—'
                });
            }
        });
        
        // Сортируем уроки по номеру
        Object.keys(schedule).forEach(day => {
            schedule[day].sort((a, b) => a.number - b.number);
        });
        
        res.json({ schedule });
        
    } catch (err) {
        console.error('Error getting teacher schedule:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить дополнительные занятия учителя
router.get('/my-extracurricular', authenticateToken, async (req, res) => {
    try {
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ activities: [] });
        }
        
        const teacherId = teacherResult.rows[0].id;
        
        // Получаем дополнительные занятия учителя
        const activitiesResult = await db.query(
            `SELECT id, name, day_of_week, start_time, end_time, room, description
             FROM extracurricular_activities
             WHERE teacher_id = $1
             ORDER BY day_of_week, start_time`,
            [teacherId]
        );
        
        const daysMap = {
            1: 'Понедельник',
            2: 'Вторник', 
            3: 'Среда',
            4: 'Четверг',
            5: 'Пятница',
            6: 'Суббота'
        };
        
        const activities = {};
        Object.values(daysMap).forEach(day => { activities[day] = []; });
        
        activitiesResult.rows.forEach(act => {
            const dayName = daysMap[act.day_of_week];
            if (dayName) {
                activities[dayName].push({
                    id: act.id,
                    name: act.name,
                    startTime: act.start_time,
                    endTime: act.end_time,
                    room: act.room || '—',
                    description: act.description || ''
                });
            }
        });
        
        res.json({ activities });
        
    } catch (err) {
        console.error('Error getting extracurricular activities:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;