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
        res.json([]);
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
        
        // Преобразуем поля для фронтенда
        const teachers = result.rows.map(teacher => ({
            ...teacher,
            unavailableDays: teacher.unavailable_days || [],
            maxConsecutiveLessons: teacher.max_consecutive_lessons || 5,
            preferredStartTime: teacher.preferred_start_time,
            preferredEndTime: teacher.preferred_end_time
        }));
        
        res.json(teachers);
    } catch (err) {
        console.error('GET /teachers error:', err);
        res.json([]);
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
        
        const teacherColor = color || '#3b82f6';
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
        
        res.status(201).json({ message: 'Учитель создан', color: teacherColor });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /teachers error:', err);
        res.status(500).json({ message: 'Ошибка создания учителя' });
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
        
        if (lastName !== undefined && firstName !== undefined) {
            await client.query(`
                UPDATE teachers 
                SET last_name = $1, first_name = $2, middle_name = $3, color = $4, room_id = $5,
                    max_consecutive_lessons = $6, unavailable_days = $7, 
                    preferred_start_time = $8, preferred_end_time = $9
                WHERE id = $10
            `, [
                lastName, firstName, middleName || null, color || '#3b82f6', roomId || null,
                maxConsecutiveLessons || 5, JSON.stringify(unavailableDays || []),
                preferredStartTime || null, preferredEndTime || null, id
            ]);
        } else {
            let updateFields = [];
            let values = [];
            let paramIndex = 1;
            
            if (color !== undefined) { updateFields.push(`color = $${paramIndex++}`); values.push(color); }
            if (roomId !== undefined) { updateFields.push(`room_id = $${paramIndex++}`); values.push(roomId || null); }
            if (maxConsecutiveLessons !== undefined) { updateFields.push(`max_consecutive_lessons = $${paramIndex++}`); values.push(maxConsecutiveLessons); }
            if (unavailableDays !== undefined) { updateFields.push(`unavailable_days = $${paramIndex++}`); values.push(JSON.stringify(unavailableDays)); }
            if (preferredStartTime !== undefined) { updateFields.push(`preferred_start_time = $${paramIndex++}`); values.push(preferredStartTime); }
            if (preferredEndTime !== undefined) { updateFields.push(`preferred_end_time = $${paramIndex++}`); values.push(preferredEndTime); }
            
            if (updateFields.length > 0) {
                values.push(id);
                await client.query(`UPDATE teachers SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, values);
            }
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
            color: checkResult.rows[0]?.color,
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

// В файле backend/routes/superadmin.js, обновите GET /classes

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
                u.login,
                u.password_hash as password,
                u.created_at
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE u.role = 'class'
            ORDER BY c.number, c.letter
        `);
        
        // Не возвращаем реальный хеш пароля, а показываем заглушку
        const classes = result.rows.map(row => ({
            ...row,
            password: '********' // Заглушка вместо реального хеша
        }));
        
        res.json(classes);
    } catch (err) {
        console.error('GET /classes error:', err);
        res.status(500).json({ message: 'Ошибка загрузки классов' });
    }
});
// В файле backend/routes/superadmin.js, найдите и замените метод POST /classes

router.post('/classes', async (req, res) => {
    const { number, letter, shift, teacherId, login, password, maxLessonsPerDay } = req.body;

    // Валидация
    if (!number || !letter || !login || !password) {
        return res.status(400).json({ 
            message: 'Номер, буква, логин и пароль обязательны',
            fields: { number: !!number, letter: !!letter, login: !!login, password: !!password }
        });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classNumber = parseInt(number);
        const classLetter = letter.toUpperCase();
        const classShift = shift ? parseInt(shift) : 1;
        const classTeacherId = teacherId ? parseInt(teacherId) : null;
        
        // 1. Проверяем существование класса
        const existingClass = await client.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [classNumber, classLetter]
        );
        
        if (existingClass.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Класс ${classNumber}${classLetter} уже существует!`,
                error: 'CLASS_EXISTS'
            });
        }
        
        // 2. Проверяем существование пользователя с таким логином
        const existingUser = await client.query(
            'SELECT id, role FROM users WHERE login = $1',
            [login]
        );
        
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Логин "${login}" уже занят. Пожалуйста, выберите другой логин.`,
                error: 'LOGIN_EXISTS'
            });
        }
        
        // 3. Хешируем пароль
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 4. Создаем пользователя
        const userResult = await client.query(
            `INSERT INTO users (login, password_hash, role, created_at) 
             VALUES ($1, $2, $3, NOW()) RETURNING id`,
            [login, passwordHash, 'class']
        );
        
        const userId = userResult.rows[0].id;
        
        // 5. Создаем класс
        const classResult = await client.query(`
            INSERT INTO classes (number, letter, shift, teacher_id, user_id, max_lessons_per_day, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, number, letter
        `, [classNumber, classLetter, classShift, classTeacherId, userId, maxLessonsPerDay || null]);
        
        await client.query('COMMIT');
        
        // Логируем успешное создание
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'create_class',
            `Создан класс ${classNumber}${classLetter} с логином ${login}`,
            JSON.stringify({ classId: classResult.rows[0].id, login, role: 'class' })
        );
        
        // Возвращаем успешный ответ
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
        
        // Обработка специфических ошибок PostgreSQL
        if (err.code === '23505') { // Unique violation
            if (err.constraint === 'users_login_key') {
                return res.status(400).json({ 
                    message: `Логин "${login}" уже существует. Пожалуйста, выберите другой.`,
                    error: 'DUPLICATE_LOGIN'
                });
            } else if (err.constraint === 'classes_user_id_key') {
                return res.status(400).json({ 
                    message: `Ошибка: пользователь уже привязан к другому классу.`,
                    error: 'USER_ALREADY_ASSIGNED'
                });
            }
        }
        
        res.status(500).json({ 
            message: 'Ошибка создания класса: ' + err.message,
            error: err.code
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
        
        // Получаем user_id класса
        const classResult = await client.query('SELECT user_id FROM classes WHERE id = $1', [id]);
        if (classResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Класс не найден' });
        }
        const userId = classResult.rows[0].user_id;
        
        // Обновляем данные класса
        if (shift !== undefined || teacherId !== undefined || maxLessonsPerDay !== undefined) {
            const updates = [];
            const values = [];
            let paramIndex = 1;
            
            if (shift !== undefined) {
                updates.push(`shift = $${paramIndex++}`);
                values.push(shift);
            }
            if (teacherId !== undefined) {
                updates.push(`teacher_id = $${paramIndex++}`);
                values.push(teacherId === null ? null : parseInt(teacherId));
            }
            if (maxLessonsPerDay !== undefined) {
                updates.push(`max_lessons_per_day = $${paramIndex++}`);
                values.push(maxLessonsPerDay === null ? null : parseInt(maxLessonsPerDay));
            }
            
            if (updates.length > 0) {
                values.push(id);
                await client.query(`UPDATE classes SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
            }
        }
        
        // Обновляем логин и пароль пользователя
        if (login !== undefined) {
            await client.query('UPDATE users SET login = $1 WHERE id = $2', [login, userId]);
        }
        
        if (password !== undefined && password !== '') {
            const passwordHash = await bcrypt.hash(password, 10);
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
        }
        
        await client.query('COMMIT');
        
        res.json({ message: 'Класс обновлен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /classes error:', err);
        res.status(500).json({ message: 'Ошибка обновления класса: ' + err.message });
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

// ========== СВЯЗЬ УЧИТЕЛЕЙ С КАБИНЕТАМИ ==========

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
        res.json([]);
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

router.delete('/lessons/bulk', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Не указаны ID уроков для удаления' });
    }
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        for (const id of ids) {
            await client.query('DELETE FROM room_lesson_priorities WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM lesson_assignments WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM teacher_lessons WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM lessons WHERE id = $1', [id]);
        }
        await client.query('COMMIT');
        res.json({ message: `Удалено ${ids.length} уроков`, count: ids.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /lessons/bulk error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.get('/lessons/export', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, short_name, description, created_at FROM lessons ORDER BY name');
        
        const wsData = [
            ['ID', 'Название урока', 'Краткое название', 'Описание', 'Дата создания'],
            ...result.rows.map(lesson => [
                lesson.id,
                lesson.name,
                lesson.short_name || '',
                lesson.description || '',
                lesson.created_at ? new Date(lesson.created_at).toLocaleString('ru-RU') : ''
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:8}, {wch:30}, {wch:20}, {wch:40}, {wch:20}];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Уроки');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=lessons_export.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('GET /lessons/export error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/lessons/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }
        
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!data || data.length < 2) {
            return res.status(400).json({ message: 'Файл не содержит данных' });
        }
        
        let added = 0;
        let skipped = 0;
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const name = row[0]?.toString().trim();
            const shortName = row[1]?.toString().trim();
            
            if (!name) continue;
            
            const existing = await db.query('SELECT id FROM lessons WHERE name = $1', [name]);
            
            if (existing.rows.length === 0) {
                await db.query(`INSERT INTO lessons (name, short_name) VALUES ($1, $2)`, [name, shortName || null]);
                added++;
            } else {
                skipped++;
            }
        }
        
        res.json({ 
            message: `Загрузка завершена. Добавлено: ${added}, Пропущено: ${skipped}`,
            added,
            skipped
        });
    } catch (err) {
        console.error('POST /lessons/upload error:', err);
        res.status(500).json({ message: 'Ошибка загрузки файла: ' + err.message });
    }
});

// ============= НАЗНАЧЕНИЯ УРОКОВ =============

router.get('/lesson-assignments', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                la.id,
                la.lesson_id,
                l.name as lesson_name,
                la.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                la.room_id,
                r.number as room_number,
                la.created_at
            FROM lesson_assignments la
            JOIN lessons l ON la.lesson_id = l.id
            JOIN teachers t ON la.teacher_id = t.id
            LEFT JOIN rooms r ON la.room_id = r.id
            ORDER BY la.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /lesson-assignments error:', err);
        res.json([]);
    }
});

router.post('/lesson-assignments', async (req, res) => {
    const { lesson_id, teacher_id, room_id } = req.body;
    
    if (!lesson_id || !teacher_id) {
        return res.status(400).json({ message: 'Урок и учитель обязательны' });
    }
    
    try {
        const existing = await db.query(`
            SELECT id FROM lesson_assignments 
            WHERE lesson_id = $1 AND teacher_id = $2 AND (room_id = $3 OR ($3 IS NULL AND room_id IS NULL))
        `, [lesson_id, teacher_id, room_id || null]);
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Такое назначение уже существует' });
        }
        
        await db.query(`
            INSERT INTO lesson_assignments (lesson_id, teacher_id, room_id) 
            VALUES ($1, $2, $3)
        `, [lesson_id, teacher_id, room_id || null]);
        
        res.status(201).json({ message: 'Урок успешно назначен' });
    } catch (err) {
        console.error('POST /lesson-assignments error:', err);
        res.status(500).json({ message: 'Ошибка назначения урока' });
    }
});

router.delete('/lesson-assignments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM lesson_assignments WHERE id = $1', [id]);
        res.json({ message: 'Назначение удалено' });
    } catch (err) {
        console.error('DELETE /lesson-assignments error:', err);
        res.status(500).json({ message: 'Ошибка удаления назначения' });
    }
});

router.get('/lessons/stats', async (req, res) => {
    try {
        const totalResult = await db.query('SELECT COUNT(*) as total FROM lessons');
        const withDescResult = await db.query('SELECT COUNT(*) as count FROM lessons WHERE description IS NOT NULL AND description != \'\'');
        res.json({
            total: parseInt(totalResult.rows[0]?.total || 0),
            withDescription: parseInt(withDescResult.rows[0]?.count || 0)
        });
    } catch (err) {
        console.error('GET /lessons/stats error:', err);
        res.json({ total: 0, withDescription: 0 });
    }
});

// ============= НАЧАТЬ НОВЫЙ УЧЕБНЫЙ ГОД =============

router.post('/start-new-school-year', async (req, res) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const classesResult = await client.query(`SELECT id, number, letter, teacher_id, shift FROM classes ORDER BY number, letter`);
        const existingClasses = classesResult.rows;
        const classesToUpgrade = [];
        const classesToRelease = [];
        existingClasses.forEach(cls => {
            if (cls.number === 11) classesToRelease.push(cls);
            else if (cls.number >= 1 && cls.number <= 10) classesToUpgrade.push(cls);
        });
        for (const cls of classesToRelease) {
            await client.query('UPDATE classes SET teacher_id = NULL WHERE id = $1', [cls.id]);
        }
        const sortedClasses = [...classesToUpgrade].sort((a, b) => b.number - a.number);
        for (const cls of sortedClasses) {
            const newNumber = cls.number + 1;
            await client.query('UPDATE classes SET number = $1 WHERE id = $2', [newNumber, cls.id]);
        }
        const firstClassesResult = await client.query(`SELECT DISTINCT letter FROM classes WHERE number = 1`);
        const existingLetters = firstClassesResult.rows.map(r => r.letter);
        const defaultLetters = ['А', 'Б', 'В', 'Г'];
        for (const letter of defaultLetters) {
            if (!existingLetters.includes(letter)) {
                const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
                const password = `class${letter}123`;
                const passwordHash = await bcrypt.hash(password, 10);
                const userResult = await client.query('INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id', [login, passwordHash, 'class']);
                const userId = userResult.rows[0].id;
                await client.query(`INSERT INTO classes (number, letter, shift, teacher_id, user_id) VALUES ($1, $2, $3, $4, $5)`, [1, letter, 1, null, userId]);
            }
        }
        await client.query(`INSERT INTO activity_log (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`, [req.user.id, 'start_new_school_year', JSON.stringify({ upgradedClasses: classesToUpgrade.length, releasedClasses: classesToRelease.length, timestamp: new Date().toISOString() })]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Новый учебный год начат', details: { upgraded: classesToUpgrade.length, released: classesToRelease.length, newFirstClasses: defaultLetters.filter(l => !existingLetters.includes(l)).length } });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /start-new-school-year error:', err);
        res.status(500).json({ message: 'Ошибка при начале нового учебного года: ' + err.message });
    } finally {
        client.release();
    }
});

router.post('/graduate-11-classes', async (req, res) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE classes SET teacher_id = NULL WHERE number = 11');
        await client.query('COMMIT');
        res.json({ success: true, message: '11 классы успешно выпущены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /graduate-11-classes error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.post('/promote-all-classes', async (req, res) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const classesResult = await client.query(`SELECT id, number, letter, teacher_id FROM classes WHERE number < 11 ORDER BY number DESC`);
        const classesToUpgrade = classesResult.rows;
        const fifthClasses = [];
        for (const cls of classesToUpgrade) {
            const newNumber = cls.number + 1;
            if (newNumber === 5) fifthClasses.push({ id: cls.id, number: newNumber, letter: cls.letter, teacher_id: cls.teacher_id });
            await client.query('UPDATE classes SET number = $1 WHERE id = $2', [newNumber, cls.id]);
        }
        const existingFirstLetters = await client.query(`SELECT DISTINCT letter FROM classes WHERE number = 1`);
        const existingLetters = existingFirstLetters.rows.map(r => r.letter);
        const defaultLetters = ['А', 'Б', 'В', 'Г'];
        const newFirstClasses = [];
        for (const letter of defaultLetters) {
            if (!existingLetters.includes(letter)) {
                const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
                const password = `class${letter}123`;
                const passwordHash = await bcrypt.hash(password, 10);
                const userResult = await client.query('INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id', [login, passwordHash, 'class']);
                const userId = userResult.rows[0].id;
                const classResult = await client.query(`INSERT INTO classes (number, letter, shift, teacher_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [1, letter, 1, null, userId]);
                newFirstClasses.push({ id: classResult.rows[0].id, number: 1, letter: letter, name: `1${letter}` });
            }
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Классы переведены', fifthClasses, newFirstClasses });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /promote-all-classes error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.get('/available-teachers-for-fifth', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) as name FROM teachers ORDER BY last_name`);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /available-teachers-for-fifth error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/all-teachers-for-select', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) as name FROM teachers ORDER BY last_name`);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /all-teachers-for-select error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/assign-fifth-class-teachers', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        for (const { classId, teacherId } of assignments) {
            await client.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [teacherId, classId]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Учителя назначены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /assign-fifth-class-teachers error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.get('/first-classes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.id, c.number, c.letter, CONCAT(c.number, c.letter) as name, c.teacher_id,
                   CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            WHERE c.number = 1
            ORDER BY c.letter
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /first-classes error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/add-first-class', async (req, res) => {
    const { letter, teacherId } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT id FROM classes WHERE number = 1 AND letter = $1', [letter.toUpperCase()]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Такой класс уже существует' });
        }
        const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
        const password = `class${letter}123`;
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await client.query('INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id', [login, passwordHash, 'class']);
        const userId = userResult.rows[0].id;
        await client.query(`INSERT INTO classes (number, letter, shift, teacher_id, user_id) VALUES ($1, $2, $3, $4, $5)`, [1, letter.toUpperCase(), 1, teacherId || null, userId]);
        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Класс добавлен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /add-first-class error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.delete('/delete-first-class/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const classResult = await client.query('SELECT user_id FROM classes WHERE id = $1', [id]);
        if (classResult.rows.length > 0) {
            await client.query('DELETE FROM users WHERE id = $1', [classResult.rows[0].user_id]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Класс удален' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /delete-first-class error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.post('/assign-first-class-teachers', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        for (const { classId, teacherId } of assignments) {
            await client.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [teacherId, classId]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Учителя назначены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /assign-first-class-teachers error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

router.post('/save-final-assignments', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        for (const { classId, teacherId } of assignments) {
            await client.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [teacherId, classId]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Изменения сохранены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /save-final-assignments error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// ============= САНПИН: ОСНОВНЫЕ ДАННЫЕ =============

router.get('/sanpin', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM sanpin_settings LIMIT 1');
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error('GET /sanpin error:', err);
        res.json({});
    }
});

router.post('/sanpin', async (req, res) => {
    const {
        schoolName, schoolAddress, classroomArea, classroomLighting, classroomVentilation,
        desksType, desksHeight, boardType, maxLessonDuration, minBreakDuration,
        maxDailyLoad, maxWeeklyLoad, firstShiftStart, secondShiftStart,
        temperatureNorm, humidityNorm, medicalRoom, nurseSchedule,
        canteenType, mealSchedule, additionalNotes
    } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM sanpin_settings LIMIT 1');
        
        if (existing.rows.length > 0) {
            await db.query(`
                UPDATE sanpin_settings SET
                    school_name = $1, school_address = $2, classroom_area = $3,
                    classroom_lighting = $4, classroom_ventilation = $5,
                    desks_type = $6, desks_height = $7, board_type = $8,
                    max_lesson_duration = $9, min_break_duration = $10,
                    max_daily_load = $11, max_weekly_load = $12,
                    first_shift_start = $13, second_shift_start = $14,
                    temperature_norm = $15, humidity_norm = $16,
                    medical_room = $17, nurse_schedule = $18,
                    canteen_type = $19, meal_schedule = $20, additional_notes = $21,
                    updated_at = NOW()
                WHERE id = $22
            `, [
                schoolName, schoolAddress, classroomArea, classroomLighting, classroomVentilation,
                desksType, desksHeight, boardType, maxLessonDuration, minBreakDuration,
                maxDailyLoad, maxWeeklyLoad, firstShiftStart, secondShiftStart,
                temperatureNorm, humidityNorm, medicalRoom, nurseSchedule,
                canteenType, mealSchedule, additionalNotes, existing.rows[0].id
            ]);
        } else {
            await db.query(`
                INSERT INTO sanpin_settings (
                    school_name, school_address, classroom_area,
                    classroom_lighting, classroom_ventilation,
                    desks_type, desks_height, board_type,
                    max_lesson_duration, min_break_duration,
                    max_daily_load, max_weekly_load,
                    first_shift_start, second_shift_start,
                    temperature_norm, humidity_norm,
                    medical_room, nurse_schedule,
                    canteen_type, meal_schedule, additional_notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            `, [
                schoolName, schoolAddress, classroomArea, classroomLighting, classroomVentilation,
                desksType, desksHeight, boardType, maxLessonDuration, minBreakDuration,
                maxDailyLoad, maxWeeklyLoad, firstShiftStart, secondShiftStart,
                temperatureNorm, humidityNorm, medicalRoom, nurseSchedule,
                canteenType, mealSchedule, additionalNotes
            ]);
        }
        
        res.json({ message: 'Данные СанПиН сохранены' });
    } catch (err) {
        console.error('POST /sanpin error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/sanpin/export', async (req, res) => {
    try {
        const sanpinResult = await db.query('SELECT * FROM sanpin_settings LIMIT 1');
        const sanpin = sanpinResult.rows[0] || {};
        
        const wsData = [
            ['Параметр', 'Значение'],
            ['Наименование учреждения', sanpin.school_name || ''],
            ['Адрес учреждения', sanpin.school_address || ''],
            ['Площадь класса на 1 ученика (м²)', sanpin.classroom_area || ''],
            ['Освещенность (люкс)', sanpin.classroom_lighting || ''],
            ['Температура воздуха (°C)', sanpin.temperature_norm || ''],
            ['Влажность воздуха (%)', sanpin.humidity_norm || ''],
            ['Вентиляция (кратность/час)', sanpin.classroom_ventilation || ''],
            ['Тип парт', sanpin.desks_type || ''],
            ['Ростовая группа парт', sanpin.desks_height || ''],
            ['Тип досок', sanpin.board_type || ''],
            ['Максимальная длительность урока (мин)', sanpin.max_lesson_duration || '45'],
            ['Минимальная длительность перемены (мин)', sanpin.min_break_duration || '10'],
            ['Максимальная дневная нагрузка (уроков)', sanpin.max_daily_load || ''],
            ['Максимальная недельная нагрузка (баллов)', sanpin.max_weekly_load || ''],
            ['Начало 1 смены', sanpin.first_shift_start || '08:00'],
            ['Начало 2 смены', sanpin.second_shift_start || '14:00'],
            ['Наличие медицинского кабинета', sanpin.medical_room || ''],
            ['График работы медсестры', sanpin.nurse_schedule || ''],
            ['Тип столовой', sanpin.canteen_type || ''],
            ['График питания', sanpin.meal_schedule || ''],
            ['Дополнительные требования', sanpin.additional_notes || '']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:40}, {wch:50}];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'СанПиН');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sanpin_report.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('GET /sanpin/export error:', err);
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

// ============= НАЗНАЧЕНИЯ КЛАССОВ ДЛЯ УЧИТЕЛЕЙ =============

router.get('/teachers/:teacherId/class-assignments', async (req, res) => {
    const { teacherId } = req.params;
    try {
        const result = await db.query(`SELECT class_id as id FROM teacher_class_assignments WHERE teacher_id = $1`, [teacherId]);
        res.json(result.rows.map(row => row.id));
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
        res.json([]);
    }
});
// Добавить дневной лимит
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

// Обновить дневной лимит
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

// Удалить дневной лимит
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

// Временно замените SELECT на этот (без updated_at):
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
        res.json([]);
    }
});

// Добавить недельный лимит
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

// Обновить недельный лимит
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

// Удалить недельный лимит
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
// ============= ПРАВИЛА СПАРИВАНИЯ УРОКОВ =============

// Получить все правила спаривания
router.get('/lesson-pairing-rules', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                lpr.id,
                lpr.class_id,
                c.number || c.letter as class_name,
                lpr.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                lpr.subject_id_1,
                ls1.name as subject_name_1,
                lpr.subject_id_2,
                ls2.name as subject_name_2,
                lpr.mandatory,
                lpr.day_of_week,
                lpr.lesson_slot1,
                lpr.lesson_slot2,
                lpr.created_at
            FROM lesson_pairing_rules lpr
            LEFT JOIN classes c ON lpr.class_id = c.id
            LEFT JOIN teachers t ON lpr.teacher_id = t.id
            LEFT JOIN lessons ls1 ON lpr.subject_id_1 = ls1.id
            LEFT JOIN lessons ls2 ON lpr.subject_id_2 = ls2.id
            ORDER BY lpr.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /lesson-pairing-rules error:', err);
        res.json([]);
    }
});

// Создать правило спаривания
router.post('/lesson-pairing-rules', async (req, res) => {
    const { class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2 } = req.body;
    
    if (!class_id || !teacher_id || !subject_id_1 || !subject_id_2) {
        return res.status(400).json({ message: 'Класс, учитель и оба предмета обязательны' });
    }
    
    try {
        const result = await db.query(`
            INSERT INTO lesson_pairing_rules (class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [class_id, teacher_id, subject_id_1, subject_id_2, mandatory || false, day_of_week || null, lesson_slot1 || null, lesson_slot2 || null]);
        
        res.status(201).json({ message: 'Правило спаривания создано', id: result.rows[0].id });
    } catch (err) {
        console.error('POST /lesson-pairing-rules error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Обновить правило спаривания
router.put('/lesson-pairing-rules/:id', async (req, res) => {
    const { id } = req.params;
    const { class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2 } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM lesson_pairing_rules WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Правило не найдено' });
        }
        
        await db.query(`
            UPDATE lesson_pairing_rules 
            SET class_id = $1, teacher_id = $2, subject_id_1 = $3, subject_id_2 = $4, 
                mandatory = $5, day_of_week = $6, lesson_slot1 = $7, lesson_slot2 = $8,
                updated_at = NOW()
            WHERE id = $9
        `, [class_id, teacher_id, subject_id_1, subject_id_2, mandatory, day_of_week, lesson_slot1, lesson_slot2, id]);
        
        res.json({ message: 'Правило обновлено' });
    } catch (err) {
        console.error('PUT /lesson-pairing-rules error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Удалить правило спаривания
router.delete('/lesson-pairing-rules/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM lesson_pairing_rules WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Правило не найдено' });
        }
        res.json({ message: 'Правило удалено' });
    } catch (err) {
        console.error('DELETE /lesson-pairing-rules error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= ГРУППОВЫЕ ЗАНЯТИЯ =============

// Получить все групповые связи
router.get('/group-division-links', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                gdl.id,
                gdl.class_id,
                c.number || c.letter as class_name,
                gdl.teacher_pair,
                gdl.room_ids,
                gdl.day_of_week,
                gdl.start_slot,
                gdl.created_at
            FROM group_division_links gdl
            LEFT JOIN classes c ON gdl.class_id = c.id
            ORDER BY gdl.created_at DESC
        `);
        
        // Парсим JSON поля
        const parsed = result.rows.map(row => ({
            ...row,
            teacher_pair: Array.isArray(row.teacher_pair) ? row.teacher_pair : (row.teacher_pair ? JSON.parse(row.teacher_pair) : []),
            room_ids: Array.isArray(row.room_ids) ? row.room_ids : (row.room_ids ? JSON.parse(row.room_ids) : [])
        }));
        
        res.json(parsed);
    } catch (err) {
        console.error('GET /group-division-links error:', err);
        res.json([]);
    }
});

// Создать групповую связь
router.post('/group-division-links', async (req, res) => {
    const { class_id, teacher_pair, room_ids, day_of_week, start_slot } = req.body;
    
    if (!class_id || !teacher_pair || !room_ids || !day_of_week || !start_slot) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    try {
        const teacherPairJson = JSON.stringify(teacher_pair);
        const roomIdsJson = JSON.stringify(room_ids);
        
        const result = await db.query(`
            INSERT INTO group_division_links (class_id, teacher_pair, room_ids, day_of_week, start_slot)
            VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
            RETURNING id
        `, [class_id, teacherPairJson, roomIdsJson, day_of_week, start_slot]);
        
        res.status(201).json({ message: 'Групповая связь создана', id: result.rows[0].id });
    } catch (err) {
        console.error('POST /group-division-links error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Обновить групповую связь
router.put('/group-division-links/:id', async (req, res) => {
    const { id } = req.params;
    const { class_id, teacher_pair, room_ids, day_of_week, start_slot } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM group_division_links WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Связь не найдена' });
        }
        
        const teacherPairJson = JSON.stringify(teacher_pair);
        const roomIdsJson = JSON.stringify(room_ids);
        
        await db.query(`
            UPDATE group_division_links 
            SET class_id = $1, teacher_pair = $2::jsonb, room_ids = $3::jsonb, 
                day_of_week = $4, start_slot = $5, updated_at = NOW()
            WHERE id = $6
        `, [class_id, teacherPairJson, roomIdsJson, day_of_week, start_slot, id]);
        
        res.json({ message: 'Групповая связь обновлена' });
    } catch (err) {
        console.error('PUT /group-division-links error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Удалить групповую связь
router.delete('/group-division-links/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM group_division_links WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Связь не найдена' });
        }
        res.json({ message: 'Групповая связь удалена' });
    } catch (err) {
        console.error('DELETE /group-division-links error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= СИНХРОНИЗАЦИЯ ПАРАЛЛЕЛЕЙ =============

// Получить все синхронизации
router.get('/class-parallel-sync', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                cps.id,
                cps.grade,
                cps.subject_id,
                l.name as subject_name,
                cps.same_day_required,
                cps.created_at
            FROM class_parallel_sync cps
            LEFT JOIN lessons l ON cps.subject_id = l.id
            ORDER BY cps.grade, l.name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /class-parallel-sync error:', err);
        res.json([]);
    }
});

// Создать синхронизацию
router.post('/class-parallel-sync', async (req, res) => {
    const { grade, subject_id, same_day_required } = req.body;
    
    if (!grade || !subject_id) {
        return res.status(400).json({ message: 'Класс и предмет обязательны' });
    }
    
    try {
        const existing = await db.query(
            'SELECT id FROM class_parallel_sync WHERE grade = $1 AND subject_id = $2',АА
            [grade, subject_id]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Синхронизация для этого класса и предмета уже существует' });
        }
        
        const result = await db.query(`
            INSERT INTO class_parallel_sync (grade, subject_id, same_day_required)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [grade, subject_id, same_day_required !== false]);
        
        res.status(201).json({ message: 'Синхронизация создана', id: result.rows[0].id });
    } catch (err) {
        console.error('POST /class-parallel-sync error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Удалить синхронизацию
router.delete('/class-parallel-sync/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM class_parallel_sync WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Синхронизация не найдена' });
        }
        res.json({ message: 'Синхронизация удалена' });
    } catch (err) {
        console.error('DELETE /class-parallel-sync error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============= ЗАПРЕЩЁННЫЕ ПОСЛЕДОВАТЕЛЬНОСТИ =============

// Получить все запрещённые последовательности
router.get('/forbidden-sequences', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, sequence_type, param1, param2, severity, created_at
            FROM forbidden_sequences
            ORDER BY created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /forbidden-sequences error:', err);
        res.json([]);
    }
});

// Создать запрещённую последовательность
router.post('/forbidden-sequences', async (req, res) => {
    const { sequence_type, param1, param2, severity } = req.body;
    
    if (!sequence_type) {
        return res.status(400).json({ message: 'Тип последовательности обязателен' });
    }
    
    if (!param2 || param2 < 1) {
        return res.status(400).json({ message: 'Количество обязательное поле' });
    }
    
    try {
        const result = await db.query(`
            INSERT INTO forbidden_sequences (sequence_type, param1, param2, severity)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [sequence_type, param1 || null, param2, severity || 'error']);
        
        res.status(201).json({ message: 'Правило создано', id: result.rows[0].id });
    } catch (err) {
        console.error('POST /forbidden-sequences error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Обновить запрещённую последовательность
router.put('/forbidden-sequences/:id', async (req, res) => {
    const { id } = req.params;
    const { sequence_type, param1, param2, severity } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM forbidden_sequences WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Правило не найдено' });
        }
        
        await db.query(`
            UPDATE forbidden_sequences 
            SET sequence_type = $1, param1 = $2, param2 = $3, severity = $4, updated_at = NOW()
            WHERE id = $5
        `, [sequence_type, param1 || null, param2, severity || 'error', id]);
        
        res.json({ message: 'Правило обновлено' });
    } catch (err) {
        console.error('PUT /forbidden-sequences error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Удалить запрещённую последовательность
router.delete('/forbidden-sequences/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM forbidden_sequences WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Правило не найдено' });
        }
        res.json({ message: 'Правило удалено' });
    } catch (err) {
        console.error('DELETE /forbidden-sequences error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;