const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// Получить класс, которым руководит учитель
router.get('/my-class', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-class called ===');
        
        const teacherResult = await db.query(
            'SELECT id, first_name, last_name, middle_name FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.json({ hasClass: false, message: 'Учитель не найден' });
        }
        
        const teacher = teacherResult.rows[0];
        console.log('Teacher found:', teacher.id);
        
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
        console.error('Error in /my-class:', err);
        res.status(500).json({ message: err.message });
    }
});

// Получить расписание учителя (уроки) - БЕЗ s.color
router.get('/my-schedule', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-schedule called ===');
        
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            console.log('Teacher not found for user_id:', req.user.id);
            return res.json({ schedule: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        console.log('Teacher ID:', teacherId);
        
        // УБРАЛ s.color
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
                    room: lesson.room || '—'
                });
            }
        });
        
        Object.keys(schedule).forEach(day => {
            schedule[day].sort((a, b) => a.number - b.number);
        });
        
        res.json({ schedule });
        
    } catch (err) {
        console.error('Error getting teacher schedule:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Получить дополнительные занятия учителя
router.get('/my-extracurricular', authenticateToken, async (req, res) => {
    try {
        console.log('=== /my-extracurricular called ===');
        
        const teacherResult = await db.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [req.user.id]
        );
        
        if (teacherResult.rows.length === 0) {
            console.log('Teacher not found');
            return res.json({ activities: {} });
        }
        
        const teacherId = teacherResult.rows[0].id;
        console.log('Teacher ID:', teacherId);
        
        const activitiesResult = await db.query(
            `SELECT id, title as name, days, start_time, end_time, room, description, color
             FROM extracurricular_activities
             WHERE teacher_id = $1
             ORDER BY days, start_time`,
            [teacherId]
        );
        
        console.log('Activities found:', activitiesResult.rows.length);
        
        const daysArray = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        
        const activities = {};
        daysArray.forEach(day => { activities[day] = []; });
        
        activitiesResult.rows.forEach(act => {
            if (act.days && Array.isArray(act.days)) {
                act.days.forEach(dayName => {
                    if (activities[dayName]) {
                        activities[dayName].push({
                            id: act.id,
                            name: act.name,
                            startTime: act.start_time,
                            endTime: act.end_time,
                            room: act.room || '—',
                            description: act.description || '',
                            color: act.color || '#ffa502'
                        });
                    }
                });
            }
        });
        
        daysArray.forEach(day => {
            activities[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        
        res.json({ activities });
        
    } catch (err) {
        console.error('Error getting extracurricular activities:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Получить расписание класса (для классного руководства) - БЕЗ s.color
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
        
        // УБРАЛ s.color
        const scheduleResult = await db.query(
            `SELECT ls.day_of_week, ls.lesson_number, ls.room, 
                    s.name as subject_name,
                    t.last_name, t.first_name, t.middle_name
             FROM lesson_schedule ls
             JOIN subjects s ON ls.subject_id = s.id
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
                    room: lesson.room || '—'
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

// Получить список учеников класса (для классного руководства)
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

module.exports = router;