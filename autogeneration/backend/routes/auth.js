// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { logActivity } = require('./activity');

const router = express.Router();

// Таблица соответствия английских букв русским
const englishToRussianLetter = (letter) => {
    const mapping = {
        'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д',
        'E': 'Е', 'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т',
        'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
        'F': 'Ф', 'H': 'Х', 'C': 'Ц', 'Y': 'Й', 'Z': 'З'
    };
    return mapping[letter.toUpperCase()] || letter;
};

// ✅ Тестовый маршрут для проверки
router.get('/test', (req, res) => {
    console.log('✅ GET /auth/test called');
    res.json({ 
        success: true, 
        message: 'Auth route is working!',
        timestamp: new Date().toISOString()
    });
});

// ✅ Основной POST маршрут
router.post('/login', async (req, res) => {
    console.log('📡 POST /login called!');
    console.log('📦 Request headers:', req.headers);
    console.log('📦 Request body:', req.body);
    
    const { login, password } = req.body;

    if (!login || !password) {
        console.log('❌ Missing login or password');
        return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    try {
        console.log(`🔍 Looking for user: ${login}`);
        
        const result = await db.query(
            'SELECT id, login, password_hash, role FROM users WHERE login = $1',
            [login]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found:', login);
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];
        console.log(`✅ User found: ${user.login}, role: ${user.role}`);
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log(`🔍 Password valid: ${isValidPassword}`);

        if (!isValidPassword) {
            console.log('❌ Invalid password for:', login);
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        console.log('✅ Token created for user:', user.login);

        let responseUser = {
            id: user.id,
            login: user.login,
            role: user.role
        };

        // ... остальной код для получения имени пользователя ...
        if (user.role === 'class') {
            const match = user.login.match(/class(\d+)([A-Za-z]+)/i);
            if (match) {
                const number = match[1];
                const englishLetter = match[2];
                const russianLetter = englishToRussianLetter(englishLetter);
                responseUser.gradeNumber = number;
                responseUser.gradeLetter = russianLetter;
                responseUser.name = `${number}${russianLetter}`;
                responseUser.className = `${number}${russianLetter}`;
            } else {
                try {
                    const classResult = await db.query(
                        `SELECT c.number, c.letter FROM classes c WHERE c.user_id = $1`,
                        [user.id]
                    );
                    if (classResult.rows.length > 0) {
                        const number = classResult.rows[0].number;
                        const letter = classResult.rows[0].letter;
                        responseUser.gradeNumber = number;
                        responseUser.gradeLetter = letter;
                        responseUser.name = `${number}${letter}`;
                        responseUser.className = `${number}${letter}`;
                    } else {
                        responseUser.name = user.login;
                        responseUser.className = user.login;
                    }
                } catch (err) {
                    console.error('Ошибка получения класса из БД:', err);
                    responseUser.name = user.login;
                    responseUser.className = user.login;
                }
            }
        }
        else if (user.role === 'teacher') {
            try {
                const teacherResult = await db.query(
                    'SELECT first_name, last_name, middle_name FROM teachers WHERE user_id = $1',
                    [user.id]
                );
                if (teacherResult.rows.length > 0) {
                    const t = teacherResult.rows[0];
                    responseUser.firstName = t.first_name;
                    responseUser.lastName = t.last_name;
                    responseUser.middleName = t.middle_name || '';
                    responseUser.name = `${t.last_name} ${t.first_name} ${t.middle_name || ''}`.trim();
                } else {
                    responseUser.name = user.login;
                }
            } catch (err) {
                console.error('Ошибка получения данных учителя:', err);
                responseUser.name = user.login;
            }
        }
        else if (user.role === 'admin') {
            try {
                const adminResult = await db.query(
                    'SELECT name FROM admins WHERE user_id = $1',
                    [user.id]
                );
                if (adminResult.rows.length > 0) {
                    responseUser.name = adminResult.rows[0].name;
                    const nameParts = responseUser.name.split(' ');
                    if (nameParts.length >= 2) {
                        responseUser.lastName = nameParts[0];
                        responseUser.firstName = nameParts[1];
                        responseUser.middleName = nameParts[2] || '';
                    }
                } else {
                    responseUser.name = user.login;
                }
            } catch (err) {
                console.error('Ошибка получения данных администратора:', err);
                responseUser.name = user.login;
            }
        }
        else if (user.role === 'superadmin') {
            responseUser.name = 'Суперадминистратор';
            responseUser.lastName = 'Суперадмин';
            responseUser.firstName = '';
            responseUser.middleName = '';
        }

        // ЛОГИРОВАНИЕ ВХОДА
        await logActivity(
            user.id,
            user.login,
            user.role,
            'login',
            `Вход в систему`,
            `Успешная авторизация`
        );

        console.log('✅ Login successful for:', user.login);
        console.log('✅ Response user:', responseUser);

        res.json({
            token,
            user: responseUser
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        console.error('❌ Error stack:', err.stack);
        res.status(500).json({ 
            message: 'Ошибка сервера',
            error: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
});

module.exports = router;