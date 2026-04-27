const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// Применяем middleware ко всем маршрутам
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============= АДМИНИСТРАТОРЫ =============
router.get('/admins', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, a.name, a.email, u.login, u.created_at
            FROM admins a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = 'admin'
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /admins error:', err);
        res.status(500).json({ message: 'Ошибка получения списка администраторов' });
    }
});

router.post('/admins', async (req, res) => {
    console.log('POST /admins:', req.body);
    
    const { login, password, name, email } = req.body;

    if (!login || !password || !name || !email) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }

    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query(
            'SELECT id FROM users WHERE login = $1',
            [login]
        );
        
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
        
        await client.query(
            'INSERT INTO admins (user_id, name, email) VALUES ($1, $2, $3)',
            [userId, name, email]
        );
        
        await client.query('COMMIT');
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'create',
            `Создан новый администратор: ${name}`,
            `Логин: ${login}, Email: ${email}`
        );
        
        res.status(201).json({ message: 'Администратор создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /admins error:', err);
        res.status(500).json({ message: 'Ошибка создания администратора' });
    } finally {
        client.release();
    }
});

router.delete('/admins/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const adminResult = await db.query(
            'SELECT user_id, name FROM admins WHERE id = $1',
            [id]
        );
        
        if (adminResult.rows.length === 0) {
            return res.status(404).json({ message: 'Администратор не найден' });
        }
        
        const userId = adminResult.rows[0].user_id;
        const adminName = adminResult.rows[0].name;
        
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Удален администратор: ${adminName}`,
           // `ID: ${id}`
        );
        
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
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                u.login,
                u.created_at,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
                     FROM teacher_subjects ts
                     JOIN subjects s ON ts.subject_id = s.id
                     WHERE ts.teacher_id = t.id),
                    '[]'::json
                ) as subjects
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY t.last_name, t.first_name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /teachers error:', err);
        res.status(500).json({ message: 'Ошибка получения списка учителей' });
    }
});

router.post('/teachers', async (req, res) => {
    console.log('POST /teachers:', req.body);
    
    const { lastName, firstName, middleName, subjectIds, login, password } = req.body;

    if (!lastName || !firstName || !login || !password) {
        return res.status(400).json({ message: 'Фамилия, имя, логин и пароль обязательны' });
    }

    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query(
            'SELECT id FROM users WHERE login = $1',
            [login]
        );
        
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
        
        const teacherResult = await client.query(
            'INSERT INTO teachers (user_id, last_name, first_name, middle_name) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, lastName, firstName, middleName || null]
        );
        
        const teacherId = teacherResult.rows[0].id;
        
        if (subjectIds && subjectIds.length > 0) {
            for (const subjectId of subjectIds) {
                await client.query(
                    'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [teacherId, subjectId]
                );
            }
        }
        
        await client.query('COMMIT');
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'create',
            `Создан новый учитель: ${lastName} ${firstName}`,
            `Логин: ${login}, Предметы: ${subjectIds?.length || 0}`
        );
        
        res.status(201).json({ message: 'Учитель создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /teachers error:', err);
        res.status(500).json({ message: 'Ошибка создания учителя' });
    } finally {
        client.release();
    }
});

router.delete('/teachers/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const teacherResult = await db.query(
            'SELECT user_id, last_name, first_name FROM teachers WHERE id = $1',
            [id]
        );
        
        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const userId = teacherResult.rows[0].user_id;
        const teacherName = `${teacherResult.rows[0].last_name} ${teacherResult.rows[0].first_name}`;
        
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Удален учитель: ${teacherName}`,
           // `ID: ${id}`
        );
        
        res.json({ message: 'Учитель удален' });
    } catch (err) {
        console.error('DELETE /teachers error:', err);
        res.status(500).json({ message: 'Ошибка удаления учителя' });
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
                c.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                u.login,
                (SELECT COUNT(*) FROM students WHERE class_id = c.id) as students_count
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON c.user_id = u.id
            WHERE u.role = 'class'
            ORDER BY c.number, c.letter
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /classes error:', err);
        res.status(500).json({ message: 'Ошибка получения списка классов' });
    }
});

router.post('/classes', async (req, res) => {
    console.log('=== POST /classes ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { number, letter, shift, teacherId, login, password } = req.body;

    if (!number || !letter || !login || !password) {
        console.log('Missing required fields');
        return res.status(400).json({ message: 'Номер, буква, логин и пароль обязательны' });
    }

    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const classNumber = parseInt(number);
        const classLetter = letter.toUpperCase();
        const classShift = shift ? parseInt(shift) : 1;
        const classTeacherId = teacherId ? parseInt(teacherId) : null;
        
        console.log('Processed data:', { classNumber, classLetter, classShift, classTeacherId, login });
        
        const existingClass = await client.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [classNumber, classLetter]
        );
        
        if (existingClass.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Класс с таким номером и буквой уже существует' });
        }
        
        const existingUser = await client.query(
            'SELECT id FROM users WHERE login = $1',
            [login]
        );
        
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'class']
        );
        
        const userId = userResult.rows[0].id;
        console.log('User created with id:', userId);
        
        const classResult = await client.query(
            `INSERT INTO classes (number, letter, shift, teacher_id, user_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [classNumber, classLetter, classShift, classTeacherId, userId]
        );
        
        console.log('Class created with id:', classResult.rows[0].id);
        
        await client.query('COMMIT');
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'create',
            `Создан новый класс: ${classNumber}${classLetter}`,
            `Логин: ${login}, Смена: ${classShift}`
        );
        
        res.status(201).json({ 
            success: true,
            message: 'Класс создан',
            class: { id: classResult.rows[0].id, number: classNumber, letter: classLetter }
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /classes ERROR:', err);
        res.status(500).json({ 
            message: 'Ошибка создания класса', 
            error: err.message,
            detail: err.detail
        });
    } finally {
        client.release();
    }
});

router.put('/classes/:id', async (req, res) => {
    const { id } = req.params;
    const { shift, teacherId } = req.body;
    
    try {
        // Получаем информацию о классе для лога
        const classInfo = await db.query(
            'SELECT number, letter FROM classes WHERE id = $1',
            [id]
        );
        const className = classInfo.rows[0] ? `${classInfo.rows[0].number}${classInfo.rows[0].letter}` : 'неизвестно';
        
        if (shift !== undefined) {
            await db.query('UPDATE classes SET shift = $1 WHERE id = $2', [shift, id]);
            
            await logActivity(
                req.user.id,
                req.user.login,
                req.user.role,
                'edit',
                `Изменена смена у класса ${className}`,
                `Новая смена: ${shift}`
            );
        }
        
        if (teacherId !== undefined) {
            const newTeacherId = teacherId === null ? null : parseInt(teacherId);
            await db.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [newTeacherId, id]);
            
            const teacherInfo = newTeacherId ? await db.query(
                'SELECT last_name, first_name FROM teachers WHERE id = $1',
                [newTeacherId]
            ) : null;
            const teacherName = teacherInfo?.rows[0] ? `${teacherInfo.rows[0].last_name} ${teacherInfo.rows[0].first_name}` : 'не назначен';
            
            await logActivity(
                req.user.id,
                req.user.login,
                req.user.role,
                'edit',
                `${newTeacherId ? 'Назначен' : 'Отвязан'} классный руководитель для класса ${className}`,
                `Руководитель: ${teacherName}`
            );
        }
        
        res.json({ message: 'Класс обновлен' });
    } catch (err) {
        console.error('PUT /classes error:', err);
        res.status(500).json({ message: 'Ошибка обновления класса' });
    }
});

router.delete('/classes/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const classResult = await db.query(
            'SELECT user_id, number, letter FROM classes WHERE id = $1',
            [id]
        );
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const userId = classResult.rows[0].user_id;
        const className = `${classResult.rows[0].number}${classResult.rows[0].letter}`;
        
        await db.query('UPDATE students SET class_id = NULL WHERE class_id = $1', [id]);
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        
        // ЛОГИРОВАНИЕ
        await logActivity(
            req.user.id,
            req.user.login,
            req.user.role,
            'delete',
            `Удален класс: ${className}`,
            `ID: ${id}`
        );
        
        res.json({ message: 'Класс удален' });
    } catch (err) {
        console.error('DELETE /classes error:', err);
        res.status(500).json({ message: 'Ошибка удаления класса' });
    }
});

// ============= ПРЕДМЕТЫ =============
router.get('/subjects', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /subjects error:', err);
        res.status(500).json({ message: 'Ошибка получения списка предметов' });
    }
});

module.exports = router;