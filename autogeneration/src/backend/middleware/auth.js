// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await db.query(
            'SELECT id, login, role FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        
        req.user = result.rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Недействительный токен' });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
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
            return res.status(403).json({ 
                message: `Доступ запрещен. Требуются роли: ${allowedRoles.join(', ')}. Ваша роль: ${req.user.role}` 
            });
        }
        
        next();
    };
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
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