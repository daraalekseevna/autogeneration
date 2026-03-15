import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Все роуты требуют авторизации и проверки на суперадмина
router.use(authMiddleware);
router.use((req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }
    next();
});

// ---------- Получение данных для форм ----------
// Список учителей (для выпадающих списков)
router.get('/teachers-list', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, middle_name FROM teachers ORDER BY last_name, first_name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Список всех предметов
router.get('/subjects', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ---------- Администраторы ----------
router.get('/admins', async (req, res) => {
    try {
        // Возвращаем пользователей с ролью admin, включая их ФИО (full_name)
        const result = await pool.query(
            `SELECT id, login, full_name as name, email 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY full_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/admins', async (req, res) => {
    const { login, password, name, email } = req.body; // name = full_name
    if (!login || !password || !name || !email) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }
    try {
        // Проверка уникальности логина
        const existing = await pool.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Логин уже занят' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (login, password_hash, role, full_name, email) 
             VALUES ($1, $2, 'admin', $3, $4) RETURNING id`,
            [login, hashed, name, email]
        );
        res.status(201).json({ message: 'Администратор создан', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/admins/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [req.params.id, 'admin']);
        res.json({ message: 'Администратор удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ---------- Учителя ----------
// Получить список учителей с предметами
router.get('/teachers', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.id, 
                    CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                    (SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
                     FROM teacher_subjects ts
                     JOIN subjects s ON ts.subject_id = s.id
                     WHERE ts.teacher_id = t.id) as subjects
             FROM teachers t
             ORDER BY t.last_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать учителя + пользователя
router.post('/teachers', async (req, res) => {
    const { lastName, firstName, middleName, subjectIds, login, password } = req.body;
    if (!lastName || !firstName || !login || !password) {
        return res.status(400).json({ message: 'Фамилия, имя, логин и пароль обязательны' });
    }
    // Проверка логина
    const existing = await pool.query('SELECT id FROM users WHERE login = $1', [login]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Логин уже занят' });
    }

    // Транзакция: создать учителя, затем пользователя, затем связи с предметами
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Создать учителя
        const teacherRes = await client.query(
            `INSERT INTO teachers (last_name, first_name, middle_name)
             VALUES ($1, $2, $3) RETURNING id`,
            [lastName, firstName, middleName || null]
        );
        const teacherId = teacherRes.rows[0].id;

        // 2. Создать пользователя
        const hashed = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO users (login, password_hash, role, teacher_id)
             VALUES ($1, $2, 'teacher', $3)`,
            [login, hashed, teacherId]
        );

        // 3. Добавить предметы, если выбраны
        if (subjectIds && subjectIds.length > 0) {
            for (const subjectId of subjectIds) {
                await client.query(
                    `INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [teacherId, subjectId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Учитель создан', id: teacherId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

router.delete('/teachers/:id', async (req, res) => {
    try {
        // Учитель и связанный пользователь удалятся каскадно (ON DELETE CASCADE в teacher_id)
        await pool.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
        res.json({ message: 'Учитель удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ---------- Классы ----------
// Получить список классов с данными о классном руководителе и количестве учеников
router.get('/classes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.grade, c.letter, c.shift,
                    CONCAT(t.last_name, ' ', t.first_name) as teacher_name,
                    t.id as teacher_id,
                    (SELECT COUNT(*) FROM users WHERE class_id = c.id AND role = 'class') as students_count
             FROM school_classes c
             LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
             ORDER BY c.grade, c.letter`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать класс + пользователя для класса
router.post('/classes', async (req, res) => {
    const { number, letter, shift, teacherId, login, password } = req.body;
    if (!number || !letter || !login || !password) {
        return res.status(400).json({ message: 'Номер, буква, логин и пароль обязательны' });
    }
    const name = `${number}${letter}`;
    
    // Проверка уникальности логина
    const existing = await pool.query('SELECT id FROM users WHERE login = $1', [login]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Логин уже занят' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Создать класс
        const classRes = await client.query(
            `INSERT INTO school_classes (name, grade, letter, shift, building_id, homeroom_teacher_id)
             VALUES ($1, $2, $3, $4, 1, $5) RETURNING id`,
            [name, number, letter, shift || 1, teacherId || null]
        );
        const classId = classRes.rows[0].id;

        // 2. Создать пользователя для класса
        const hashed = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO users (login, password_hash, role, class_id)
             VALUES ($1, $2, 'class', $3)`,
            [login, hashed, classId]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Класс создан', id: classId });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') { // уникальность имени класса
            return res.status(400).json({ message: 'Класс с таким именем уже существует' });
        }
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// Обновить класс (смена или классный руководитель)
router.put('/classes/:id', async (req, res) => {
    const { shift, teacherId } = req.body;
    try {
        if (shift !== undefined) {
            await pool.query('UPDATE school_classes SET shift = $1 WHERE id = $2', [shift, req.params.id]);
        }
        if (teacherId !== undefined) {
            await pool.query('UPDATE school_classes SET homeroom_teacher_id = $1 WHERE id = $2', [teacherId || null, req.params.id]);
        }
        res.json({ message: 'Класс обновлён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить класс
router.delete('/classes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM school_classes WHERE id = $1', [req.params.id]);
        res.json({ message: 'Класс удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;