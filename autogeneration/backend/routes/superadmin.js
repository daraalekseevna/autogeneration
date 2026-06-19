// routes/superadmin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('./activity');
const multer = require('multer');
const XLSX = require('xlsx');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============= АДМИНИСТРАТОРЫ =============

router.get('/admins', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, a.name, u.login, u.created_at
            FROM admins a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = 'admin'
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /admins error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/admins', async (req, res) => {
    const { login, password, name } = req.body;
    if (!login || !password || !name) {
        return res.status(400).json({ message: 'Логин, пароль и ФИО обязательны' });
    }
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existingUser = await client.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'admin']
        );
        const userId = userResult.rows[0].id;
        await client.query('INSERT INTO admins (user_id, name) VALUES ($1, $2)', [userId, name]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Администратор создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /admins error:', err);
        res.status(500).json({ message: 'Ошибка создания администратора' });
    } finally {
        client.release();
    }
});

router.put('/admins/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.query('UPDATE admins SET name = $1 WHERE id = $2', [name, id]);
        res.json({ message: 'Администратор обновлен' });
    } catch (err) {
        console.error('PUT /admins error:', err);
        res.status(500).json({ message: 'Ошибка обновления администратора' });
    }
});

router.delete('/admins/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const adminResult = await db.query('SELECT user_id FROM admins WHERE id = $1', [id]);
        if (adminResult.rows.length > 0) {
            await db.query('DELETE FROM users WHERE id = $1', [adminResult.rows[0].user_id]);
        }
        res.json({ message: 'Администратор удален' });
    } catch (err) {
        console.error('DELETE /admins error:', err);
        res.status(500).json({ message: 'Ошибка удаления администратора' });
    }
});

// ============= УЧИТЕЛЯ =============

router.get('/teachers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id, 
                t.last_name, 
                t.first_name, 
                t.middle_name,
                t.color,  
                t.room_id,
                t.max_consecutive_lessons,
                t.unavailable_days,
                t.preferred_start_time,
                t.preferred_end_time,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                u.login,
                u.created_at,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', l.id, 'name', l.name))
                     FROM teacher_lessons tl
                     JOIN lessons l ON tl.lesson_id = l.id
                     WHERE tl.teacher_id = t.id),
                    '[]'::json
                ) as lessons,
                COALESCE(
                    (SELECT json_agg(tl.lesson_id)
                     FROM teacher_lessons tl
                     WHERE tl.teacher_id = t.id),
                    '[]'::json
                ) as "lessonIds",
                COALESCE(
                    (SELECT json_agg(tca.class_id)
                     FROM teacher_class_assignments tca
                     WHERE tca.teacher_id = t.id),
                    '[]'::json
                ) as "classIds"
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY t.last_name, t.first_name
        `);
        
        const teachers = result.rows.map(teacher => ({
            ...teacher,
            unavailableDays: teacher.unavailable_days || [],
            maxConsecutiveLessons: teacher.max_consecutive_lessons || 5,
            preferredStartTime: teacher.preferred_start_time,
            preferredEndTime: teacher.preferred_end_time,
            color: teacher.color || '#b8e2ff' // ✅ ДОБАВЬТЕ ЭТУ СТРОКУ
        }));
        
        res.json(teachers);
    } catch (err) {
        console.error('GET /teachers error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/teachers', async (req, res) => {
    const { 
        lastName, firstName, middleName, lessonIds, classIds, login, password, color, roomId,
        maxConsecutiveLessons, unavailableDays, preferredStartTime, preferredEndTime 
    } = req.body;

    if (!lastName || !firstName || !login || !password) {
        return res.status(400).json({ message: 'Фамилия, имя, логин и пароль обязательны' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'teacher']
        );
        
        const userId = userResult.rows[0].id;
        
        const teacherColor = color || '#b8e2ff';
        const teacherRoomId = roomId ? parseInt(roomId) : null;
        
        const teacherResult = await client.query(`
            INSERT INTO teachers (
                user_id, last_name, first_name, middle_name, color, room_id,
                max_consecutive_lessons, unavailable_days, preferred_start_time, preferred_end_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
        `, [
            userId, lastName, firstName, middleName || null, teacherColor, teacherRoomId,
            maxConsecutiveLessons || 5, JSON.stringify(unavailableDays || []), 
            preferredStartTime || null, preferredEndTime || null
        ]);
        
        const teacherId = teacherResult.rows[0].id;
        
        if (lessonIds && lessonIds.length > 0) {
            for (const lessonId of lessonIds) {
                await client.query(
                    'INSERT INTO teacher_lessons (teacher_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [teacherId, lessonId]
                );
            }
        }
        
        if (classIds && classIds.length > 0) {
            for (const classId of classIds) {
                await client.query(
                    'INSERT INTO teacher_class_assignments (teacher_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [teacherId, classId]
                );
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Учитель создан', 
            color: teacherColor,
            id: teacherId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /teachers error:', err);
        res.status(500).json({ message: 'Ошибка создания учителя: ' + err.message });
    } finally {
        client.release();
    }
});

router.put('/teachers/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        lessonIds, classIds, lastName, firstName, middleName, color, roomId,
        maxConsecutiveLessons, unavailableDays, preferredStartTime, preferredEndTime 
    } = req.body;
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const teacherCheck = await client.query('SELECT id FROM teachers WHERE id = $1', [id]);
        if (teacherCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        if (lastName !== undefined) { updates.push(`last_name = $${paramIndex++}`); values.push(lastName); }
        if (firstName !== undefined) { updates.push(`first_name = $${paramIndex++}`); values.push(firstName); }
        if (middleName !== undefined) { updates.push(`middle_name = $${paramIndex++}`); values.push(middleName || null); }
        if (color !== undefined) { updates.push(`color = $${paramIndex++}`); values.push(color); }
        if (roomId !== undefined) { updates.push(`room_id = $${paramIndex++}`); values.push(roomId || null); }
        if (maxConsecutiveLessons !== undefined) { updates.push(`max_consecutive_lessons = $${paramIndex++}`); values.push(maxConsecutiveLessons); }
        if (unavailableDays !== undefined) { updates.push(`unavailable_days = $${paramIndex++}`); values.push(JSON.stringify(unavailableDays)); }
        if (preferredStartTime !== undefined) { updates.push(`preferred_start_time = $${paramIndex++}`); values.push(preferredStartTime); }
        if (preferredEndTime !== undefined) { updates.push(`preferred_end_time = $${paramIndex++}`); values.push(preferredEndTime); }
        
        if (updates.length > 0) {
            values.push(id);
            const query = `UPDATE teachers SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`;
            await client.query(query, values);
        }
        
        if (lessonIds !== undefined) {
            await client.query('DELETE FROM teacher_lessons WHERE teacher_id = $1', [id]);
            if (lessonIds && lessonIds.length > 0) {
                for (const lessonId of lessonIds) {
                    await client.query(
                        'INSERT INTO teacher_lessons (teacher_id, lesson_id) VALUES ($1, $2)',
                        [id, lessonId]
                    );
                }
            }
        }
        
        if (classIds !== undefined) {
            await client.query('DELETE FROM teacher_class_assignments WHERE teacher_id = $1', [id]);
            if (classIds && classIds.length > 0) {
                for (const classId of classIds) {
                    await client.query(
                        'INSERT INTO teacher_class_assignments (teacher_id, class_id) VALUES ($1, $2)',
                        [id, classId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        const checkResult = await client.query('SELECT color, room_id FROM teachers WHERE id = $1', [id]);
        
        res.json({ 
            message: 'Данные учителя обновлены',
            color: checkResult.rows[0]?.color || '#b8e2ff',
            roomId: checkResult.rows[0]?.room_id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /teachers error:', err);
        res.status(500).json({ message: 'Ошибка обновления учителя: ' + err.message });
    } finally {
        client.release();
    }
});

router.patch('/teachers/:id/color', async (req, res) => {
    const { id } = req.params;
    const { color } = req.body;
    
    if (!color) {
        return res.status(400).json({ message: 'Цвет обязателен' });
    }
    
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
        return res.status(400).json({ message: 'Неверный формат цвета' });
    }
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const teacherExists = await client.query('SELECT id FROM teachers WHERE id = $1', [id]);
        if (teacherExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const result = await client.query(
            'UPDATE teachers SET color = $1, updated_at = NOW() WHERE id = $2 RETURNING id, color',
            [color, id]
        );
        
        await client.query(
            'UPDATE extended_teachers SET section_color = $1 WHERE school_teacher_id = $2',
            [color, id]
        );
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true,
            message: 'Цвет обновлен успешно',
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PATCH /teachers/:id/color error:', err);
        res.status(500).json({ message: 'Ошибка обновления цвета: ' + err.message });
    } finally {
        client.release();
    }
});

router.delete('/teachers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const teacherResult = await db.query('SELECT user_id FROM teachers WHERE id = $1', [id]);
        if (teacherResult.rows.length > 0) {
            await db.query('DELETE FROM teacher_lessons WHERE teacher_id = $1', [id]);
            await db.query('DELETE FROM teacher_class_assignments WHERE teacher_id = $1', [id]);
            await db.query('DELETE FROM teacher_rooms WHERE teacher_id = $1', [id]);
            await db.query('DELETE FROM users WHERE id = $1', [teacherResult.rows[0].user_id]);
        }
        res.json({ message: 'Учитель удален' });
    } catch (err) {
        console.error('DELETE /teachers error:', err);
        res.status(500).json({ message: 'Ошибка удаления учителя' });
    }
});

// ============= ПЕДАГОГИ ДОПОЛНИТЕЛЬНОГО ОБРАЗОВАНИЯ =============

router.get('/extended-teachers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                et.id,
                et.last_name,
                et.first_name,
                et.middle_name,
                et.section_name,
                et.section_color,
                et.school_teacher_id,
                et.created_at,
                CONCAT(et.last_name, ' ', et.first_name, ' ', COALESCE(et.middle_name, '')) as name,
                COALESCE(t.color, et.section_color) as color
            FROM extended_teachers et
            LEFT JOIN teachers t ON et.school_teacher_id = t.id
            ORDER BY et.last_name, et.first_name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /extended-teachers error:', err);
        res.status(500).json({ message: 'Ошибка загрузки педагогов доп. образования' });
    }
});

router.post('/extended-teachers', async (req, res) => {
    const { lastName, firstName, middleName, sectionName, sectionColor, schoolTeacherId } = req.body;
    
    if (!sectionName) {
        return res.status(400).json({ message: 'Название секции обязательно' });
    }
    
    if (schoolTeacherId) {
        const teacherExists = await db.query('SELECT id FROM teachers WHERE id = $1', [schoolTeacherId]);
        if (teacherExists.rows.length === 0) {
            return res.status(400).json({ message: 'Указанный учитель не найден' });
        }
    } else {
        if (!lastName || !firstName) {
            return res.status(400).json({ message: 'Фамилия и имя обязательны для внешнего педагога' });
        }
    }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        let finalLastName = lastName;
        let finalFirstName = firstName;
        let finalMiddleName = middleName || null;
        let finalSectionColor = sectionColor || '#ff6b6b';
        
        if (schoolTeacherId) {
            const teacherResult = await client.query(
                'SELECT last_name, first_name, middle_name, color FROM teachers WHERE id = $1',
                [schoolTeacherId]
            );
            
            if (teacherResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Указанный учитель не найден' });
            }
            
            const teacherData = teacherResult.rows[0];
            finalLastName = teacherData.last_name;
            finalFirstName = teacherData.first_name;
            finalMiddleName = teacherData.middle_name;
            finalSectionColor = teacherData.color;
        }
        
        const result = await client.query(`
            INSERT INTO extended_teachers (last_name, first_name, middle_name, section_name, section_color, school_teacher_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [finalLastName, finalFirstName, finalMiddleName, sectionName, finalSectionColor, schoolTeacherId || null]);
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: schoolTeacherId ? 'Секция назначена учителю' : 'Педагог доп. образования добавлен',
            id: result.rows[0].id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /extended-teachers error:', err);
        res.status(500).json({ message: 'Ошибка создания: ' + err.message });
    } finally {
        client.release();
    }
});

router.put('/extended-teachers/:id', async (req, res) => {
    const { id } = req.params;
    const { lastName, firstName, middleName, sectionName, sectionColor, schoolTeacherId } = req.body;
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        const existing = await client.query('SELECT id FROM extended_teachers WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Запись не найдена' });
        }
        
        let finalLastName = lastName;
        let finalFirstName = firstName;
        let finalMiddleName = middleName || null;
        let finalSectionColor = sectionColor || '#ff6b6b';
        
        if (schoolTeacherId) {
            const teacherResult = await client.query(
                'SELECT last_name, first_name, middle_name, color FROM teachers WHERE id = $1',
                [schoolTeacherId]
            );
            
            if (teacherResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Указанный учитель не найден' });
            }
            
            const teacherData = teacherResult.rows[0];
            finalLastName = teacherData.last_name;
            finalFirstName = teacherData.first_name;
            finalMiddleName = teacherData.middle_name;
            finalSectionColor = teacherData.color;
        } else {
            if (!finalLastName || !finalFirstName) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Фамилия и имя обязательны для внешнего педагога' });
            }
        }
        
        await client.query(`
            UPDATE extended_teachers 
            SET last_name = $1, first_name = $2, middle_name = $3, 
                section_name = $4, section_color = $5, school_teacher_id = $6
            WHERE id = $7
        `, [finalLastName, finalFirstName, finalMiddleName, sectionName, finalSectionColor, schoolTeacherId || null, id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Данные обновлены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /extended-teachers error:', err);
        res.status(500).json({ message: 'Ошибка обновления: ' + err.message });
    } finally {
        client.release();
    }
});

router.delete('/extended-teachers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM extended_teachers WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }
        res.json({ message: 'Педагог удален' });
    } catch (err) {
        console.error('DELETE /extended-teachers error:', err);
        res.status(500).json({ message: 'Ошибка удаления: ' + err.message });
    }
});

// ============= КЛАССЫ =============

router.get('/classes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id,
                c.number,
                c.letter,
                CONCAT(c.number, c.letter) as name,
                c.shift,
                c.max_lessons_per_day,
                c.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                t.color as teacher_color,
                u.login,
                u.created_at
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE u.role = 'class'
            ORDER BY c.number, c.letter
        `);
        
        const classes = result.rows.map(row => ({
            ...row,
            password: '********'
        }));
        
        res.json(classes);
    } catch (err) {
        console.error('GET /classes error:', err);
        res.status(500).json({ message: 'Ошибка загрузки классов: ' + err.message });
    }
});

router.post('/classes', async (req, res) => {
    const { number, letter, shift, teacherId, login, password, maxLessonsPerDay } = req.body;

    if (!number || !letter || !login || !password) {
        return res.status(400).json({ 
            message: 'Номер, буква, логин и пароль обязательны'
        });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classNumber = parseInt(number);
        const classLetter = letter.toUpperCase();
        const classShift = shift ? parseInt(shift) : 1;
        const classTeacherId = teacherId ? parseInt(teacherId) : null;
        
        const existingClass = await client.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [classNumber, classLetter]
        );
        
        if (existingClass.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Класс ${classNumber}${classLetter} уже существует!`
            });
        }
        
        const existingUser = await client.query(
            'SELECT id FROM users WHERE login = $1',
            [login]
        );
        
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Логин "${login}" уже занят`
            });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            `INSERT INTO users (login, password_hash, role, created_at) 
             VALUES ($1, $2, $3, NOW()) RETURNING id`,
            [login, passwordHash, 'class']
        );
        
        const userId = userResult.rows[0].id;
        
        const classResult = await client.query(`
            INSERT INTO classes (number, letter, shift, teacher_id, user_id, max_lessons_per_day, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, number, letter
        `, [classNumber, classLetter, classShift, classTeacherId, userId, maxLessonsPerDay || null]);
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            success: true,
            message: `Класс ${classNumber}${classLetter} успешно создан!`,
            data: {
                id: classResult.rows[0].id,
                name: `${classNumber}${classLetter}`,
                login: login,
                password: password,
                shift: classShift
            }
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /classes error:', err);
        
        if (err.code === '23505') {
            if (err.constraint === 'users_login_key') {
                return res.status(400).json({ 
                    message: `Логин "${login}" уже существует`
                });
            }
        }
        
        res.status(500).json({ 
            message: 'Ошибка создания класса: ' + err.message
        });
    } finally {
        client.release();
    }
});

router.put('/classes/:id', async (req, res) => {
    const { id } = req.params;
    const { shift, teacherId, maxLessonsPerDay, login, password } = req.body;
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classResult = await client.query('SELECT user_id FROM classes WHERE id = $1', [id]);
        if (classResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Класс не найден' });
        }
        const userId = classResult.rows[0].user_id;
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        if (shift !== undefined && shift !== null) {
            updates.push(`shift = $${paramIndex++}`);
            values.push(parseInt(shift));
        }
        
        if (teacherId !== undefined) {
            updates.push(`teacher_id = $${paramIndex++}`);
            values.push(teacherId === null || teacherId === '' ? null : parseInt(teacherId));
        }
        
        if (maxLessonsPerDay !== undefined) {
            updates.push(`max_lessons_per_day = $${paramIndex++}`);
            values.push(maxLessonsPerDay === null || maxLessonsPerDay === '' ? null : parseInt(maxLessonsPerDay));
        }
        
        if (updates.length > 0) {
            values.push(id);
            const query = `UPDATE classes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`;
            await client.query(query, values);
        }
        
        if (login !== undefined && login !== null && login.trim() !== '') {
            const trimmedLogin = login.trim();
            
            const existingUser = await client.query(
                'SELECT id FROM users WHERE login = $1 AND id != $2',
                [trimmedLogin, userId]
            );
            
            if (existingUser.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `Логин "${trimmedLogin}" уже занят` 
                });
            }
            
            await client.query(
                'UPDATE users SET login = $1, updated_at = NOW() WHERE id = $2',
                [trimmedLogin, userId]
            );
        }
        
        if (password !== undefined && password !== null && password.trim() !== '') {
            const passwordHash = await bcrypt.hash(password.trim(), 10);
            await client.query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [passwordHash, userId]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true,
            message: 'Класс обновлен успешно' 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /classes error:', err);
        
        if (err.code === '23505') {
            return res.status(400).json({ 
                message: 'Такой логин уже существует в системе'
            });
        }
        
        res.status(500).json({ 
            message: 'Ошибка обновления класса: ' + err.message
        });
    } finally {
        client.release();
    }
});

router.delete('/classes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const classResult = await db.query('SELECT user_id FROM classes WHERE id = $1', [id]);
        if (classResult.rows.length > 0) {
            await db.query('UPDATE students SET class_id = NULL WHERE class_id = $1', [id]);
            await db.query('DELETE FROM teacher_class_assignments WHERE class_id = $1', [id]);
            await db.query('DELETE FROM users WHERE id = $1', [classResult.rows[0].user_id]);
        }
        res.json({ message: 'Класс удален' });
    } catch (err) {
        console.error('DELETE /classes error:', err);
        res.status(500).json({ message: 'Ошибка удаления класса' });
    }
});

// ============= НАЗНАЧЕНИЯ КЛАССОВ ДЛЯ УЧИТЕЛЕЙ =============

router.get('/teachers/:teacherId/class-assignments', async (req, res) => {
    const { teacherId } = req.params;
    try {
        const result = await db.query(`
            SELECT class_id 
            FROM teacher_class_assignments 
            WHERE teacher_id = $1
        `, [teacherId]);
        res.json(result.rows.map(row => row.class_id));
    } catch (err) {
        console.error('GET /teachers/:teacherId/class-assignments error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/teachers/:teacherId/class-assignments', async (req, res) => {
    const { teacherId } = req.params;
    const { classIds } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM teacher_class_assignments WHERE teacher_id = $1', [teacherId]);
        if (classIds && classIds.length > 0) {
            for (const classId of classIds) {
                await client.query(`
                    INSERT INTO teacher_class_assignments (teacher_id, class_id)
                    VALUES ($1, $2) ON CONFLICT DO NOTHING
                `, [teacherId, classId]);
            }
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Назначения классов обновлены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /teachers/:teacherId/class-assignments error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// ============= УРОКИ =============

router.get('/lessons', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, short_name, description, default_pairing_allowed, min_interval_days, created_at 
            FROM lessons 
            ORDER BY name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /lessons error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/lessons', async (req, res) => {
    const { name, shortName, description, defaultPairingAllowed, minIntervalDays } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Название урока обязательно' });
    }
    if (!shortName) {
        return res.status(400).json({ message: 'Краткое название урока обязательно' });
    }
    
    try {
        const existing = await db.query('SELECT id FROM lessons WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Урок с таким названием уже существует' });
        }
        
        const result = await db.query(`
            INSERT INTO lessons (name, short_name, description, default_pairing_allowed, min_interval_days) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, name, short_name, description, created_at
        `, [name, shortName, description || null, defaultPairingAllowed !== false, minIntervalDays || 1]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /lessons error:', err);
        res.status(500).json({ message: 'Ошибка добавления урока' });
    }
});

router.put('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { name, shortName, description, defaultPairingAllowed, minIntervalDays } = req.body;
    
    try {
        const lesson = await db.query('SELECT name FROM lessons WHERE id = $1', [id]);
        if (lesson.rows.length === 0) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await db.query(`
            UPDATE lessons 
            SET name = $1, short_name = $2, description = $3, 
                default_pairing_allowed = $4, min_interval_days = $5 
            WHERE id = $6
        `, [name, shortName, description || null, defaultPairingAllowed !== false, minIntervalDays || 1, id]);
        
        res.json({ message: 'Урок обновлен' });
    } catch (err) {
        console.error('PUT /lessons error:', err);
        res.status(500).json({ message: 'Ошибка обновления урока' });
    }
});

router.delete('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const lessonResult = await db.query('SELECT name FROM lessons WHERE id = $1', [id]);
        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await db.query('DELETE FROM room_lesson_priorities WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM lesson_assignments WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM teacher_lessons WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM lessons WHERE id = $1', [id]);
        
        res.json({ message: 'Урок удален' });
    } catch (err) {
        console.error('DELETE /lessons error:', err);
        res.status(500).json({ message: 'Ошибка удаления урока' });
    }
});

// ============= КАБИНЕТЫ =============

router.get('/rooms', async (req, res) => {
    try {
        const roomsResult = await db.query(`
            SELECT 
                r.id,
                r.number,
                r.name,
                r.priority,
                r.allow_shared_usage,
                r.shared_subject_ids,
                r.created_at
            FROM rooms r
            ORDER BY r.number
        `);
        
        const rooms = await Promise.all(roomsResult.rows.map(async (room) => {
            const teachersResult = await db.query(`
                SELECT t.id, t.last_name, t.first_name, t.middle_name, 
                       CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                       t.color
                FROM teachers t
                INNER JOIN teacher_rooms tr ON t.id = tr.teacher_id
                WHERE tr.room_id = $1
                ORDER BY t.last_name, t.first_name
            `, [room.id]);
            
            const prioritiesResult = await db.query(`
                SELECT lp.id, lp.lesson_id, l.name as lesson_name
                FROM room_lesson_priorities lp
                LEFT JOIN lessons l ON lp.lesson_id = l.id
                WHERE lp.room_id = $1
            `, [room.id]);
            
            return {
                ...room,
                teachers: teachersResult.rows,
                lesson_priorities: prioritiesResult.rows
            };
        }));
        
        res.json(rooms);
    } catch (err) {
        console.error('GET /rooms error:', err);
        res.status(500).json({ message: 'Ошибка загрузки кабинетов: ' + err.message });
    }
});

router.post('/rooms', async (req, res) => {
    const { number, name, priority, lessonPriorities = [], allowSharedUsage, sharedSubjectIds } = req.body;

    if (!number) {
        return res.status(400).json({ message: 'Номер кабинета обязателен' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existing = await client.query('SELECT id FROM rooms WHERE number = $1', [String(number)]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Кабинет с таким номером уже существует' });
        }
        
        const result = await client.query(`
            INSERT INTO rooms (number, name, priority, allow_shared_usage, shared_subject_ids)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, number, name, priority
        `, [String(number), name || null, parseInt(priority) || 0, allowSharedUsage !== false, JSON.stringify(sharedSubjectIds || [])]);
        
        const roomId = result.rows[0].id;
        
        if (lessonPriorities && lessonPriorities.length > 0) {
            for (const lessonId of lessonPriorities) {
                const cleanLessonId = parseInt(lessonId);
                if (!isNaN(cleanLessonId)) {
                    await client.query(`
                        INSERT INTO room_lesson_priorities (room_id, lesson_id) 
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [roomId, cleanLessonId]);
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ message: 'Кабинет добавлен', roomId: roomId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /rooms error:', err);
        res.status(500).json({ message: 'Ошибка добавления кабинета: ' + err.message });
    } finally {
        client.release();
    }
});

router.put('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { number, name, priority, lessonPriorities = [], allowSharedUsage, sharedSubjectIds } = req.body;

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existing = await client.query('SELECT id FROM rooms WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Кабинет не найден' });
        }
        
        const duplicateNumber = await client.query(
            'SELECT id FROM rooms WHERE number = $1 AND id != $2',
            [String(number), id]
        );
        if (duplicateNumber.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Кабинет с таким номером уже существует' });
        }
        
        await client.query(`
            UPDATE rooms SET 
                number = $1, 
                name = $2, 
                priority = $3,
                allow_shared_usage = $4,
                shared_subject_ids = $5
            WHERE id = $6
        `, [String(number), name || null, parseInt(priority) || 0, allowSharedUsage !== false, JSON.stringify(sharedSubjectIds || []), id]);
        
        await client.query('DELETE FROM room_lesson_priorities WHERE room_id = $1', [id]);
        
        if (lessonPriorities && lessonPriorities.length > 0) {
            for (const lessonId of lessonPriorities) {
                const cleanLessonId = parseInt(lessonId);
                if (!isNaN(cleanLessonId)) {
                    await client.query(`
                        INSERT INTO room_lesson_priorities (room_id, lesson_id) 
                        VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [id, cleanLessonId]);
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ message: 'Кабинет обновлен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /rooms error:', err);
        res.status(500).json({ message: 'Ошибка обновления кабинета: ' + err.message });
    } finally {
        client.release();
    }
});

router.delete('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        await client.query('DELETE FROM teacher_rooms WHERE room_id = $1', [id]);
        await client.query('DELETE FROM room_lesson_priorities WHERE room_id = $1', [id]);
        await client.query('DELETE FROM rooms WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Кабинет удален' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /rooms error:', err);
        res.status(500).json({ message: 'Ошибка удаления кабинета' });
    } finally {
        client.release();
    }
});

// ============= СВЯЗЬ УЧИТЕЛЕЙ С КАБИНЕТАМИ =============

router.get('/rooms/:roomId/teachers', async (req, res) => {
    const { roomId } = req.params;
    try {
        const result = await db.query(`
            SELECT t.id, t.last_name, t.first_name, t.middle_name, 
                   CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                   t.color
            FROM teachers t
            INNER JOIN teacher_rooms tr ON t.id = tr.teacher_id
            WHERE tr.room_id = $1
            ORDER BY t.last_name, t.first_name
        `, [roomId]);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /rooms/:roomId/teachers error:', err);
        res.status(500).json({ message: 'Ошибка получения учителей кабинета: ' + err.message });
    }
});

router.put('/rooms/:roomId/teachers', async (req, res) => {
    const { roomId } = req.params;
    const { teacherIds } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM teacher_rooms WHERE room_id = $1', [roomId]);
        if (teacherIds && teacherIds.length > 0) {
            for (const teacherId of teacherIds) {
                await client.query(
                    'INSERT INTO teacher_rooms (teacher_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [teacherId, roomId]
                );
            }
        }
        await client.query('COMMIT');
        const result = await db.query(`
            SELECT t.id, t.last_name, t.first_name, t.middle_name, 
                   CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                   t.color
            FROM teachers t
            INNER JOIN teacher_rooms tr ON t.id = tr.teacher_id
            WHERE tr.room_id = $1
            ORDER BY t.last_name, t.first_name
        `, [roomId]);
        res.json(result.rows);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /rooms/:roomId/teachers error:', err);
        res.status(500).json({ message: 'Ошибка обновления учителей кабинета: ' + err.message });
    } finally {
        client.release();
    }
});

router.get('/teachers/:teacherId/rooms', async (req, res) => {
    const { teacherId } = req.params;
    try {
        const result = await db.query(`
            SELECT r.id, r.number, r.name
            FROM rooms r
            INNER JOIN teacher_rooms tr ON r.id = tr.room_id
            WHERE tr.teacher_id = $1
            ORDER BY r.number
        `, [teacherId]);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /teachers/:teacherId/rooms error:', err);
        res.status(500).json({ message: 'Ошибка получения кабинетов учителя: ' + err.message });
    }
});

// ============= ДНЕВНЫЕ ЛИМИТЫ НАГРУЗКИ =============

router.get('/daily-load-limits', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, grade, day_name, min_weight, max_weight, max_lessons, created_at
            FROM daily_load_limits
            ORDER BY grade, 
                CASE day_name
                    WHEN 'monday' THEN 1
                    WHEN 'tuesday' THEN 2
                    WHEN 'wednesday' THEN 3
                    WHEN 'thursday' THEN 4
                    WHEN 'friday' THEN 5
                    WHEN 'saturday' THEN 6
                    WHEN 'sunday' THEN 7
                    ELSE 8
                END
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /daily-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/daily-load-limits', async (req, res) => {
    const { grade, day_name, min_weight, max_weight, max_lessons } = req.body;
    
    if (!grade || !day_name) {
        return res.status(400).json({ message: 'Класс и день недели обязательны' });
    }
    
    try {
        const existing = await db.query(
            'SELECT id FROM daily_load_limits WHERE grade = $1 AND day_name = $2',
            [grade, day_name]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Лимит для этого класса и дня уже существует' });
        }
        
        const result = await db.query(`
            INSERT INTO daily_load_limits (grade, day_name, min_weight, max_weight, max_lessons)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, grade, day_name, min_weight, max_weight, max_lessons
        `, [grade, day_name, min_weight || 0, max_weight || 0, max_lessons || null]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /daily-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/daily-load-limits/:id', async (req, res) => {
    const { id } = req.params;
    const { grade, day_name, min_weight, max_weight, max_lessons } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM daily_load_limits WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Лимит не найден' });
        }
        
        await db.query(`
            UPDATE daily_load_limits 
            SET grade = $1, day_name = $2, min_weight = $3, max_weight = $4, max_lessons = $5, updated_at = NOW()
            WHERE id = $6
        `, [grade, day_name, min_weight || 0, max_weight || 0, max_lessons || null, id]);
        
        res.json({ message: 'Лимит обновлен' });
    } catch (err) {
        console.error('PUT /daily-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/daily-load-limits/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM daily_load_limits WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Лимит не найден' });
        }
        res.json({ message: 'Лимит удален' });
    } catch (err) {
        console.error('DELETE /daily-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= НЕДЕЛЬНЫЕ ЛИМИТЫ НАГРУЗКИ =============

router.get('/weekly-load-limits', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, grade, week_weight, month_weight, created_at
            FROM weekly_load_limits
            ORDER BY grade
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /weekly-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/weekly-load-limits', async (req, res) => {
    const { grade, week_weight, month_weight } = req.body;
    
    if (!grade) {
        return res.status(400).json({ message: 'Класс обязателен' });
    }
    
    try {
        const existing = await db.query(
            'SELECT id FROM weekly_load_limits WHERE grade = $1',
            [grade]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Лимит для этого класса уже существует' });
        }
        
        const result = await db.query(`
            INSERT INTO weekly_load_limits (grade, week_weight, month_weight)
            VALUES ($1, $2, $3)
            RETURNING id, grade, week_weight, month_weight
        `, [grade, week_weight || 0, month_weight || 0]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /weekly-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/weekly-load-limits/:id', async (req, res) => {
    const { id } = req.params;
    const { grade, week_weight, month_weight } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM weekly_load_limits WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Лимит не найден' });
        }
        
        await db.query(`
            UPDATE weekly_load_limits 
            SET grade = $1, week_weight = $2, month_weight = $3, updated_at = NOW()
            WHERE id = $4
        `, [grade, week_weight || 0, month_weight || 0, id]);
        
        res.json({ message: 'Лимит обновлен' });
    } catch (err) {
        console.error('PUT /weekly-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.delete('/weekly-load-limits/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM weekly_load_limits WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Лимит не найден' });
        }
        res.json({ message: 'Лимит удален' });
    } catch (err) {
        console.error('DELETE /weekly-load-limits error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= САНПИН: РАНГИ СЛОЖНОСТИ ПРЕДМЕТОВ =============

router.get('/sanpin/subject-difficulty', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT sd.id, sd.grade, sd.subject_id, l.name as subject_name, l.short_name,
                   sd.difficulty_rank, sd.subject_type, sd.created_at, sd.updated_at
            FROM subject_difficulty sd
            JOIN lessons l ON sd.subject_id = l.id
            ORDER BY sd.grade, l.name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /sanpin/subject-difficulty error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/sanpin/subject-difficulty', async (req, res) => {
    const { grade, subject_id, difficulty_rank, subject_type } = req.body;
    
    if (!grade || !subject_id || difficulty_rank === undefined) {
        return res.status(400).json({ message: 'Класс, предмет и ранг сложности обязательны' });
    }
    if (difficulty_rank < 1 || difficulty_rank > 10) {
        return res.status(400).json({ message: 'Ранг сложности должен быть от 1 до 10' });
    }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT id FROM subject_difficulty WHERE grade = $1 AND subject_id = $2', [grade, subject_id]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Запись для этого класса и предмета уже существует' });
        }
        const result = await client.query(`
            INSERT INTO subject_difficulty (grade, subject_id, difficulty_rank, subject_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id, grade, subject_id, difficulty_rank, subject_type
        `, [grade, subject_id, difficulty_rank, subject_type || 'neutral']);
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /sanpin/subject-difficulty error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.put('/sanpin/subject-difficulty/:id', async (req, res) => {
    const { id } = req.params;
    const { grade, subject_id, difficulty_rank, subject_type } = req.body;
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT id FROM subject_difficulty WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Запись не найдена' });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (grade !== undefined) { updates.push(`grade = $${paramIndex++}`); values.push(grade); }
        if (subject_id !== undefined) { updates.push(`subject_id = $${paramIndex++}`); values.push(subject_id); }
        if (difficulty_rank !== undefined) { updates.push(`difficulty_rank = $${paramIndex++}`); values.push(difficulty_rank); }
        if (subject_type !== undefined) { updates.push(`subject_type = $${paramIndex++}`); values.push(subject_type); }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        await client.query(`UPDATE subject_difficulty SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        await client.query('COMMIT');
        res.json({ message: 'Ранг сложности обновлен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /sanpin/subject-difficulty error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.delete('/sanpin/subject-difficulty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM subject_difficulty WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.json({ message: 'Ранг сложности удален' });
    } catch (err) {
        console.error('DELETE /sanpin/subject-difficulty error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= САНПИН: ЧАСЫ НАГРУЗКИ ПРЕДМЕТОВ =============

router.get('/sanpin/subject-hours', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT sh.id, sh.grade, sh.subject_id, l.name as subject_name, l.short_name,
                   sh.hours_per_week, sh.hours_per_year, sh.created_at, sh.updated_at
            FROM subject_hours sh
            JOIN lessons l ON sh.subject_id = l.id
            ORDER BY sh.grade, l.name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /sanpin/subject-hours error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/sanpin/subject-hours', async (req, res) => {
    const { grade, subject_id, hours_per_week, hours_per_year } = req.body;
    
    if (!grade || !subject_id) {
        return res.status(400).json({ message: 'Класс и предмет обязательны' });
    }
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT id FROM subject_hours WHERE grade = $1 AND subject_id = $2', [grade, subject_id]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Запись для этого класса и предмета уже существует' });
        }
        const result = await client.query(`
            INSERT INTO subject_hours (grade, subject_id, hours_per_week, hours_per_year)
            VALUES ($1, $2, $3, $4)
            RETURNING id, grade, subject_id, hours_per_week, hours_per_year
        `, [grade, subject_id, hours_per_week || 0, hours_per_year || 0]);
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /sanpin/subject-hours error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.put('/sanpin/subject-hours/:id', async (req, res) => {
    const { id } = req.params;
    const { grade, subject_id, hours_per_week, hours_per_year } = req.body;
    
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT id FROM subject_hours WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Запись не найдена' });
        }
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (grade !== undefined) { updates.push(`grade = $${paramIndex++}`); values.push(grade); }
        if (subject_id !== undefined) { updates.push(`subject_id = $${paramIndex++}`); values.push(subject_id); }
        if (hours_per_week !== undefined) { updates.push(`hours_per_week = $${paramIndex++}`); values.push(hours_per_week); }
        if (hours_per_year !== undefined) { updates.push(`hours_per_year = $${paramIndex++}`); values.push(hours_per_year); }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        
        await client.query(`UPDATE subject_hours SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        await client.query('COMMIT');
        res.json({ message: 'Нагрузка обновлена' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /sanpin/subject-hours error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.delete('/sanpin/subject-hours/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM subject_hours WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Запись не найдена' });
        res.json({ message: 'Нагрузка удалена' });
    } catch (err) {
        console.error('DELETE /sanpin/subject-hours error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= ГЕНЕРАЦИЯ РАСПИСАНИЯ =============

router.post('/generate-schedule', async (req, res) => {
    try {
        const axios = require('axios');
        const MICROSERVICE_URL = process.env.SCHEDULE_GENERATOR_URL || 'http://localhost:5001';
        
        console.log('Запуск генерации расписания...');
        
        const response = await axios.post(`${MICROSERVICE_URL}/api/generate`, {
            nodeApiUrl: `${req.protocol}://${req.get('host')}`,
            token: req.headers.authorization?.replace('Bearer ', '')
        }, {
            timeout: 300000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
            res.json({ success: true, message: 'Расписание сгенерировано' });
        } else {
            res.status(500).json({ success: false, message: response.data.error });
        }
    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;