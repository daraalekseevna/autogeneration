import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import superadminRoutes from './routes/superadmin.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/superadmin', superadminRoutes);

// Автоматическое создание суперадмина при первом запуске
const initializeSuperAdmin = async () => {
    try {
        const result = await pool.query('SELECT id FROM users WHERE login = $1', ['superadmin']);
        if (result.rows.length === 0) {
            const hashed = await bcrypt.hash('superadmin123', 10);
            await pool.query(
                `INSERT INTO users (login, password_hash, role, full_name) VALUES ($1, $2, 'superadmin', 'Супер Администратор')`,
                ['superadmin', hashed]
            );
            console.log('✅ Суперадмин создан (логин: superadmin, пароль: superadmin123)');
        } else {
            console.log('ℹ️ Суперадмин уже существует');
        }
    } catch (err) {
        console.error('❌ Ошибка при создании суперадмина:', err);
    }
};

initializeSuperAdmin().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
});