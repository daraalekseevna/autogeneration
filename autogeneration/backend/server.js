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
const PORT = process.env.PORT || 3000;

// === CORS - РАСШИРЕННЫЙ ===
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование
app.use((req, res, next) => {
    console.log(`→ ${req.method} ${req.url}`);
    next();
});

// === HEALTH CHECKS ===
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// === ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ===
(async () => {
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ Database connection successful');
        } else {
            console.error('❌ Database connection failed');
        }
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    }
})();

// === РЕГИСТРАЦИЯ МАРШРУТОВ ===
console.log('📌 Registering routes...');

// ✅ AUTH - ПЕРВЫЙ И САМЫЙ ВАЖНЫЙ
console.log('📦 authRoutes type:', typeof authRoutes);
console.log('📦 authRoutes:', authRoutes ? 'loaded' : 'NOT loaded');

app.use('/api/auth', authRoutes);
console.log('✅ /api/auth registered');

// ✅ Остальные роуты
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/extracurricular', extracurricularRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/superadmin', newSchoolYearRoutes);
app.use('/api/superadmin', extracurricularRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/activity', activityRoutes.router);
app.use('/api/schedule-generator', scheduleGeneratorRoutes);

// === 404 ===
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        error: 'not_found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// === ОБРАБОТКА ОШИБОК ===
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(500).json({
        success: false,
        error: 'internal_error',
        message: err.message
    });
});

// === ЗАПУСК ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server started successfully`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 API base: /api`);
    console.log(`📍 Auth: /api/auth/login`);
});