// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    console.log('Token:', token ? token.substring(0, 30) + '...' : 'null');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', decoded);
        
        // ✅ ИСПРАВЛЕНО: пробуем оба варианта - userId или id
        const userId = decoded.userId || decoded.id;
        
        if (!userId) {
            console.error('❌ No user ID in token. Decoded:', decoded);
            return res.status(401).json({ message: 'Неверный формат токена' });
        }
        
        const result = await db.query(
            'SELECT id, login, role FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            console.error('❌ User not found:', userId);
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        
        req.user = result.rows[0];
        console.log('✅ User authenticated:', req.user.login, 'role:', req.user.role);
        next();
    } catch (err) {
        console.error('❌ Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Токен истек' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Недействительный токен' });
        }
        return res.status(403).json({ message: 'Ошибка авторизации' });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Не авторизован' });
    }
    if (req.user.role !== 'superadmin') {
        console.log('❌ Access denied for role:', req.user.role);
        return res.status(403).json({ message: 'Доступ только для суперадминистратора' });
    }
    next();
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            console.log('❌ Access denied. Required:', allowedRoles, 'User role:', req.user.role);
            return res.status(403).json({ 
                message: `Доступ запрещен. Требуются роли: ${allowedRoles.join(', ')}. Ваша роль: ${req.user.role}` 
            });
        }
        
        next();
    };
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Не авторизован' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        console.log('❌ Access denied for role:', req.user.role);
        return res.status(403).json({ message: 'Доступ только для администраторов' });
    }
    next();
};

module.exports = { 
    authenticateToken, 
    requireSuperAdmin,
    authorizeRoles,
    requireAdmin
};