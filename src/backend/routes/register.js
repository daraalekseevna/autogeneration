import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Все маршруты require авторизацию
router.use(authMiddleware);

// Проверка на суперадмина
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }
    next();
};

// Получить список учителей
router.get('/teachers', requireSuperAdmin, async (req, res) => {
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

// Получить список классов
router.get('/classes', requireSuperAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, grade, letter FROM school_classes ORDER BY grade, letter'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать пользователя
router.post('/register', requireSuperAdmin, async (req, res) => {
    const { login, password, role, teacherId, classId } = req.body;

    if (!login || !password || !role) {
        return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE login = $1', [login]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Логин уже занят' });
    }

    if (role === 'teacher' && !teacherId) {
        return res.status(400).json({ message: 'Для учителя нужно указать teacherId' });
    }
    if (role === 'class' && !classId) {
        return res.status(400).json({ message: 'Для класса нужно указать classId' });
    }
    if ((role === 'superadmin' || role === 'admin') && (teacherId || classId)) {
        return res.status(400).json({ message: 'Для этой роли не нужно указывать teacherId/classId' });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (login, password_hash, role, teacher_id, class_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, login, role`,
            [login, hashed, role, teacherId || null, classId || null]
        );
        res.status(201).json({ message: 'Пользователь создан', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при создании пользователя' });
    }
});

export default router;