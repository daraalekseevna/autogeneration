const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    try {
        const result = await db.query(
            'SELECT id, login, password_hash, role FROM users WHERE login = $1',
            [login]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                login: user.login,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; // ВАЖНО: экспортируем router