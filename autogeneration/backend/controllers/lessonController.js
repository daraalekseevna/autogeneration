// controllers/lessonController.js
import Lesson from '../models/Lesson.js';
import multer from 'multer';
import XLSX from 'xlsx';

// Получить все уроки
export const getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.findAll({
            attributes: ['id', 'name', 'shortName', 'description', 'createdAt'],
            order: [['name', 'ASC']]
        });
        res.json(lessons);
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ message: 'Ошибка получения уроков' });
    }
};

// Добавить урок вручную
export const addLesson = async (req, res) => {
    try {
        const { name, shortName, description } = req.body;
        
        if (!name || !shortName) {
            return res.status(400).json({ message: 'Название и краткое название обязательны' });
        }
        
        const lesson = await Lesson.create({
            name,
            shortName,
            description: description || ''
        });
        
        res.status(201).json(lesson);
    } catch (error) {
        console.error('Add lesson error:', error);
        res.status(500).json({ message: 'Ошибка добавления урока' });
    }
};

// Обновить урок
export const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, shortName, description } = req.body;
        
        const lesson = await Lesson.findByPk(id);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        if (name) lesson.name = name;
        if (shortName) lesson.shortName = shortName;
        if (description !== undefined) lesson.description = description;
        
        await lesson.save();
        
        res.json(lesson);
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ message: 'Ошибка обновления урока' });
    }
};

// Удалить урок
export const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        
        const lesson = await Lesson.findByPk(id);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await lesson.destroy();
        
        res.json({ message: 'Урок удален' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ message: 'Ошибка удаления урока' });
    }
};

// Массовое удаление уроков
export const bulkDeleteLessons = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !ids.length) {
            return res.status(400).json({ message: 'Не выбраны уроки для удаления' });
        }
        
        await Lesson.destroy({ where: { id: ids } });
        
        res.json({ message: `Удалено ${ids.length} уроков` });
    } catch (error) {
        console.error('Bulk delete lessons error:', error);
        res.status(500).json({ message: 'Ошибка удаления уроков' });
    }
};

// Загрузка уроков из Excel
export const uploadLessons = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }
        
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length < 2) {
            return res.status(400).json({ message: 'Файл должен содержать заголовки и данные' });
        }
        
        const lessons = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const name = row[0]?.toString().trim();
            const shortName = row[1]?.toString().trim();
            
            if (name && shortName) {
                lessons.push({
                    name,
                    shortName,
                    description: ''
                });
            }
        }
        
        if (lessons.length === 0) {
            return res.status(400).json({ message: 'Нет данных для загрузки' });
        }
        
        const created = await Lesson.bulkCreate(lessons, { ignoreDuplicates: true });
        
        res.json({
            message: `Загружено ${created.length} уроков`,
            count: created.length
        });
    } catch (error) {
        console.error('Upload lessons error:', error);
        res.status(500).json({ message: 'Ошибка загрузки уроков' });
    }
};

// Экспорт уроков в Excel
export const exportLessons = async (req, res) => {
    try {
        const lessons = await Lesson.findAll({
            attributes: ['name', 'shortName'],
            order: [['name', 'ASC']]
        });
        
        const data = [
            ['Название урока', 'Краткое название'],
            ...lessons.map(l => [l.name, l.shortName])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Уроки');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=lessons.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export lessons error:', error);
        res.status(500).json({ message: 'Ошибка экспорта уроков' });
    }
};