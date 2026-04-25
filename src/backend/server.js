const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const superadminRoutes = require('./routes/superadmin');
const teacherRoutes = require('./routes/teacher');
const extracurricularRoutes = require('./routes/extracurricular'); // ДОБАВЛЕНО

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Регистрируем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/extracurricular', extracurricularRoutes); // ДОБАВЛЕНО

// Проверочный маршрут
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});