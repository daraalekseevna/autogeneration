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

// === CORS ===
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

// ✅ Обработка OPTIONS
app.options('*', cors());

app.use(express.json());

// Логирование
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
        environment: process.env.NODE_ENV || 'development'
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