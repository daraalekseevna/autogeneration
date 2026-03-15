import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Заполните все поля' });
        }

        const result = await pool.query(
            `SELECT u.id, u.login, u.password_hash, u.role,
                    t.first_name, t.last_name, t.middle_name,
                    c.name as class_name
             FROM users u
             LEFT JOIN teachers t ON u.teacher_id = t.id
             LEFT JOIN school_classes c ON u.class_id = c.id
             WHERE u.login = $1`,
            [username]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            { id: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password_hash, ...userData } = user;
        res.json({ token, user: userData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;