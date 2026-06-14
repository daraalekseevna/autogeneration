// controllers/teacherController.js
import Teacher from '../models/Teacher.js';
import bcrypt from 'bcryptjs';

// Получить всех учителей
export const getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            attributes: ['id', 'name', 'login', 'role', 'color', 'lessonIds'],
            order: [['name', 'ASC']]
        });
        res.json(teachers);
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Ошибка получения учителей' });
    }
};

// Добавить учителя
export const addTeacher = async (req, res) => {
    try {
        const { lastName, firstName, middleName, login, password, lessonIds, color } = req.body;
        
        const name = [lastName, firstName, middleName].filter(Boolean).join(' ');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const teacher = await Teacher.create({
            name,
            login,
            password: hashedPassword,
            role: 'teacher',
            color: color || '#3b82f6',
            lessonIds: lessonIds || []
        });
        
        res.status(201).json({
            id: teacher.id,
            name: teacher.name,
            login: teacher.login,
            color: teacher.color,
            lessonIds: teacher.lessonIds
        });
    } catch (error) {
        console.error('Add teacher error:', error);
        res.status(500).json({ message: 'Ошибка добавления учителя' });
    }
};

// Обновить учителя
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { lastName, firstName, middleName, lessonIds, color } = req.body;
        
        const teacher = await Teacher.findByPk(id);
        if (!teacher) {
            return res.status(404).json({ message: 'Учитель не найден' });
        }
        
        const updates = {};
        
        if (lastName && firstName) {
            updates.name = [lastName, firstName, middleName].filter(Boolean).join(' ');
        }
        
        if (lessonIds !== undefined) {
            updates.lessonIds = lessonIds;
        }
        
        if (color) {
            updates.color = color;
        }
        
        await teacher.update(updates);
        
        res.json({
            id: teacher.id,
            name: teacher.name,
            login: teacher.login,
            color: teacher.color,
            lessonIds: teacher.lessonIds
        });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ message: 'Ошибка обновления учителя' });
    }
};