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

// === ТОЧНАЯ НАСТРОЙКА CORS ===
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://autogeneration.vercel.app',
    'https://sosh20-schedule.vercel.app',
    'https://school-n20-schedule.vercel.app',
    'https://autogeneration.onrender.com',
    'https://schedule-generator-j794.onrender.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error(`CORS policy: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Логирование запросов
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`→ ${req.method} ${req.url}`);
        next();
    });
}

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

// === КОРНЕВОЙ МАРШРУТ ===
app.get('/', (req, res) => {
    res.json({ 
        name: 'School Management System API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: '/api/auth',
            superadmin: '/api/superadmin',
            admin: '/api/admin',
            teacher: '/api/teacher',
            extracurricular: '/api/extracurricular',
            schedule: '/api/schedule',
            activity: '/api/activity',
            scheduleGenerator: '/api/schedule-generator',
            health: '/api/health',
            healthz: '/healthz'
        }
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

// ============================================================
// === РЕГИСТРАЦИЯ МАРШРУТОВ - ВАЖНЫЙ ПОРЯДОК! ===
// ============================================================

// ✅ 1. Сначала основные роуты
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

// ✅ 2. Extracurricular регистрируем ПЕРВЫМ (до superadmin)
//    Это важно, чтобы /api/superadmin/extended-teachers не перехватывался superadminRoutes
app.use('/api/extracurricular', extracurricularRoutes);
app.use('/api/superadmin', extracurricularRoutes); // ДЛЯ /api/superadmin/extended-teachers

// ✅ 3. Superadmin регистрируем ПОСЛЕ extracurricular
app.use('/api/superadmin', superadminRoutes);
app.use('/api/superadmin', newSchoolYearRoutes);

// ✅ 4. Остальные роуты
app.use('/api/schedule', scheduleRoutes);
app.use('/api/activity', activityRoutes.router);
app.use('/api/schedule-generator', scheduleGeneratorRoutes);

// ============================================================
// === ТЕСТОВЫЙ МАРШРУТ ДЛЯ ПРОВЕРКИ ТОКЕНА ===
// ============================================================
app.get('/api/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ valid: false, message: 'No token provided' });
        }
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        const result = await db.query(
            'SELECT id, login, role FROM users WHERE id = $1',
            [decoded.userId || decoded.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ valid: false, message: 'User not found' });
        }
        
        res.json({ 
            valid: true, 
            user: result.rows[0],
            decoded: decoded
        });
    } catch (err) {
        res.status(403).json({ 
            valid: false, 
            message: err.message 
        });
    }
});

// === ОБРАБОТКА 404 ===
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false, 
        error: 'not_found',
        message: `Route ${req.method} ${req.url} not found`,
        timestamp: new Date().toISOString()
    });
});

// === ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК ===
app.use((err, req, res, next) => {
    console.error('❌ Server error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        url: req.url,
        method: req.method
    });
    
    if (err.message && err.message.includes('CORS')) {
        res.status(403).json({ 
            success: false, 
            error: 'cors_error',
            message: err.message 
        });
        return;
    }
    
    res.status(500).json({ 
        success: false, 
        error: 'internal_server_error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Внутренняя ошибка сервера' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server started successfully`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 Bind: 0.0.0.0`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Health check: /healthz`);
    console.log(`📍 API base: /api`);
});

// === GRACEFUL SHUTDOWN ===
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});