// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const superadminRoutes = require('./routes/superadmin');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const extracurricularRoutes = require('./routes/extracurricular');
const scheduleRoutes = require('./routes/schedule');
const activityRoutes = require('./routes/activity');
const newSchoolYearRoutes = require('./routes/newSchoolYear');
const scheduleGeneratorRoutes = require('./routes/scheduleGenerator');
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Проверка подключения к БД (асинхронно, не блокирует запуск)
(async () => {
    await db.testConnection();
})();

// === ВАЖНО: Регистрация всех маршрутов ===
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/superadmin', newSchoolYearRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/extracurricular', extracurricularRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/activity', activityRoutes.router);
app.use('/api/schedule-generator', scheduleGeneratorRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Отладка всех запросов
app.use((req, res, next) => {
    console.log(`→ ${req.method} ${req.url}`);
    next();
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('❌ Ошибка сервера:', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Внутренняя ошибка сервера' 
    });
});

// 404
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.url}` });
});

app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
    console.log(`📍 Admin routes available at /api/admin`);
    console.log(`📍 Schedule generator routes available at /api/schedule-generator`);
});