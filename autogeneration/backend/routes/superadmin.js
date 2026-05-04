// routes/superadmin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('./activity');
const multer = require('multer');
const XLSX = require('xlsx');

const router = express.Router();

// Настройка multer для загрузки файлов (в память)
const upload = multer({ storage: multer.memoryStorage() });

// Применяем middleware ко всем маршрутам
router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============= АДМИНИСТРАТОРЫ =============

// Получить всех администраторов
router.get('/admins', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id, a.name, u.login, u.created_at
            FROM admins a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = 'admin'
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /admins error:', err);
        res.json([]);
    }
});

// Создать администратора
router.post('/admins', async (req, res) => {
    const { login, password, name } = req.body;

    if (!login || !password || !name) {
        return res.status(400).json({ message: 'Логин, пароль и ФИО обязательны' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'admin']
        );
        
        const userId = userResult.rows[0].id;
        
        await client.query('INSERT INTO admins (user_id, name) VALUES ($1, $2)', [userId, name]);
        
        await client.query('COMMIT');
        
        res.status(201).json({ message: 'Администратор создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /admins error:', err);
        res.status(500).json({ message: 'Ошибка создания администратора' });
    } finally {
        client.release();
    }
});

// Обновить администратора
router.put('/admins/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    try {
        await db.query('UPDATE admins SET name = $1 WHERE id = $2', [name, id]);
        res.json({ message: 'Администратор обновлен' });
    } catch (err) {
        console.error('PUT /admins error:', err);
        res.status(500).json({ message: 'Ошибка обновления администратора' });
    }
});

// Удалить администратора
router.delete('/admins/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const adminResult = await db.query('SELECT user_id FROM admins WHERE id = $1', [id]);
        if (adminResult.rows.length > 0) {
            await db.query('DELETE FROM users WHERE id = $1', [adminResult.rows[0].user_id]);
        }
        res.json({ message: 'Администратор удален' });
    } catch (err) {
        console.error('DELETE /admins error:', err);
        res.status(500).json({ message: 'Ошибка удаления администратора' });
    }
});

// ============= УЧИТЕЛЯ =============

// Получить всех учителей
router.get('/teachers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.id, 
                t.last_name, 
                t.first_name, 
                t.middle_name,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name,
                u.login,
                u.created_at,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', l.id, 'name', l.name))
                     FROM teacher_lessons tl
                     JOIN lessons l ON tl.lesson_id = l.id
                     WHERE tl.teacher_id = t.id),
                    '[]'::json
                ) as lessons,
                COALESCE(
                    (SELECT json_agg(tl.lesson_id)
                     FROM teacher_lessons tl
                     WHERE tl.teacher_id = t.id),
                    '[]'::json
                ) as lessonIds
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY t.last_name, t.first_name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /teachers error:', err);
        res.json([]);
    }
});

// Создать учителя
router.post('/teachers', async (req, res) => {
    const { lastName, firstName, middleName, lessonIds, login, password } = req.body;

    if (!lastName || !firstName || !login || !password) {
        return res.status(400).json({ message: 'Фамилия, имя, логин и пароль обязательны' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'teacher']
        );
        
        const userId = userResult.rows[0].id;
        
        const teacherResult = await client.query(
            'INSERT INTO teachers (user_id, last_name, first_name, middle_name) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, lastName, firstName, middleName || null]
        );
        
        const teacherId = teacherResult.rows[0].id;
        
        if (lessonIds && lessonIds.length > 0) {
            for (const lessonId of lessonIds) {
                await client.query(
                    'INSERT INTO teacher_lessons (teacher_id, lesson_id) VALUES ($1, $2) ON CONFLICT (teacher_id, lesson_id) DO NOTHING',
                    [teacherId, lessonId]
                );
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ message: 'Учитель создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /teachers error:', err);
        res.status(500).json({ message: 'Ошибка создания учителя' });
    } finally {
        client.release();
    }
});

// Обновить учителя
router.put('/teachers/:id', async (req, res) => {
    const { id } = req.params;
    const { lessonIds, lastName, firstName, middleName } = req.body;
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        if (lastName && firstName) {
            await client.query(
                'UPDATE teachers SET last_name = $1, first_name = $2, middle_name = $3 WHERE id = $4',
                [lastName, firstName, middleName || null, id]
            );
        }
        
        if (lessonIds !== undefined) {
            await client.query('DELETE FROM teacher_lessons WHERE teacher_id = $1', [id]);
            
            if (lessonIds && lessonIds.length > 0) {
                for (const lessonId of lessonIds) {
                    await client.query(
                        'INSERT INTO teacher_lessons (teacher_id, lesson_id) VALUES ($1, $2)',
                        [id, lessonId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ message: 'Данные учителя обновлены' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /teachers error:', err);
        res.status(500).json({ message: 'Ошибка обновления учителя' });
    } finally {
        client.release();
    }
});

// Удалить учителя
router.delete('/teachers/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const teacherResult = await db.query('SELECT user_id FROM teachers WHERE id = $1', [id]);
        if (teacherResult.rows.length > 0) {
            await db.query('DELETE FROM teacher_lessons WHERE teacher_id = $1', [id]);
            await db.query('DELETE FROM users WHERE id = $1', [teacherResult.rows[0].user_id]);
        }
        res.json({ message: 'Учитель удален' });
    } catch (err) {
        console.error('DELETE /teachers error:', err);
        res.status(500).json({ message: 'Ошибка удаления учителя' });
    }
});

// ============= КЛАССЫ =============

// Получить все классы
router.get('/classes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id,
                c.number,
                c.letter,
                CONCAT(c.number, c.letter) as name,
                c.shift,
                c.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                u.login
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON c.user_id = u.id
            WHERE u.role = 'class'
            ORDER BY c.number, c.letter
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /classes error:', err);
        res.json([]);
    }
});

// Создать класс
router.post('/classes', async (req, res) => {
    const { number, letter, shift, teacherId, login, password } = req.body;

    if (!number || !letter || !login || !password) {
        return res.status(400).json({ message: 'Номер, буква, логин и пароль обязательны' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classNumber = parseInt(number);
        const classLetter = letter.toUpperCase();
        const classShift = shift ? parseInt(shift) : 1;
        const classTeacherId = teacherId ? parseInt(teacherId) : null;
        
        const existingClass = await client.query(
            'SELECT id FROM classes WHERE number = $1 AND letter = $2',
            [classNumber, classLetter]
        );
        
        if (existingClass.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Класс с таким номером и буквой уже существует' });
        }
        
        const existingUser = await client.query('SELECT id FROM users WHERE login = $1', [login]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'class']
        );
        
        const userId = userResult.rows[0].id;
        
        const classResult = await client.query(
            `INSERT INTO classes (number, letter, shift, teacher_id, user_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [classNumber, classLetter, classShift, classTeacherId, userId]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({ message: 'Класс создан' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /classes error:', err);
        res.status(500).json({ message: 'Ошибка создания класса' });
    } finally {
        client.release();
    }
});

// Обновить класс
router.put('/classes/:id', async (req, res) => {
    const { id } = req.params;
    const { shift, teacherId } = req.body;
    
    try {
        if (shift !== undefined) {
            await db.query('UPDATE classes SET shift = $1 WHERE id = $2', [shift, id]);
        }
        
        if (teacherId !== undefined) {
            const newTeacherId = teacherId === null ? null : parseInt(teacherId);
            await db.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [newTeacherId, id]);
        }
        
        res.json({ message: 'Класс обновлен' });
    } catch (err) {
        console.error('PUT /classes error:', err);
        res.status(500).json({ message: 'Ошибка обновления класса' });
    }
});

// Удалить класс
router.delete('/classes/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const classResult = await db.query('SELECT user_id FROM classes WHERE id = $1', [id]);
        if (classResult.rows.length > 0) {
            await db.query('UPDATE students SET class_id = NULL WHERE class_id = $1', [id]);
            await db.query('DELETE FROM users WHERE id = $1', [classResult.rows[0].user_id]);
        }
        res.json({ message: 'Класс удален' });
    } catch (err) {
        console.error('DELETE /classes error:', err);
        res.status(500).json({ message: 'Ошибка удаления класса' });
    }
});

// ============= КАБИНЕТЫ =============

// Получить все кабинеты
router.get('/rooms', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                number, 
                name, 
                building, 
                capacity, 
                has_computers, 
                has_projector, 
                has_smartboard, 
                is_laboratory, 
                is_gym, 
                is_music, 
                is_art, 
                priority,
                created_at,
                updated_at
            FROM rooms
            ORDER BY priority DESC, number
        `);
        
        const rooms = (result.rows || []).map(room => ({
            ...room,
            lesson_priorities: []
        }));
        
        res.json(rooms);
    } catch (err) {
        console.error('GET /rooms error:', err);
        res.json([]);
    }
});

// Добавить кабинет
router.post('/rooms', async (req, res) => {
    const { 
        number, 
        name, 
        building = null, 
        capacity = 30, 
        hasComputers = false, 
        hasProjector = false, 
        hasSmartboard = false, 
        isLaboratory = false, 
        isGym = false, 
        isMusic = false, 
        isArt = false, 
        priority = 0 
    } = req.body;

    if (!number) {
        return res.status(400).json({ message: 'Номер кабинета обязателен' });
    }

    try {
        const result = await db.query(`
            INSERT INTO rooms (
                number, name, building, capacity, 
                has_computers, has_projector, has_smartboard,
                is_laboratory, is_gym, is_music, is_art, 
                priority
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `, [
            number, name, building, capacity, 
            hasComputers, hasProjector, hasSmartboard,
            isLaboratory, isGym, isMusic, isArt, 
            priority
        ]);
        
        res.status(201).json({ message: 'Кабинет добавлен', roomId: result.rows[0].id });
    } catch (err) {
        console.error('POST /rooms error:', err);
        res.status(500).json({ message: 'Ошибка добавления кабинета: ' + err.message });
    }
});

// Обновить кабинет
router.put('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        number, 
        name, 
        building, 
        capacity, 
        hasComputers, 
        hasProjector, 
        hasSmartboard,
        isLaboratory, 
        isGym, 
        isMusic, 
        isArt, 
        priority 
    } = req.body;

    try {
        const result = await db.query(`
            UPDATE rooms SET 
                number = $1, 
                name = $2, 
                building = $3, 
                capacity = $4,
                has_computers = $5, 
                has_projector = $6, 
                has_smartboard = $7,
                is_laboratory = $8, 
                is_gym = $9, 
                is_music = $10, 
                is_art = $11,
                priority = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING number
        `, [
            number, name, building, capacity, 
            hasComputers, hasProjector, hasSmartboard,
            isLaboratory, isGym, isMusic, isArt, 
            priority, id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Кабинет не найден' });
        }
        
        res.json({ message: 'Кабинет обновлен' });
    } catch (err) {
        console.error('PUT /rooms error:', err);
        res.status(500).json({ message: 'Ошибка обновления кабинета' });
    }
});

// Удалить кабинет
router.delete('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const room = await db.query('SELECT number FROM rooms WHERE id = $1', [id]);
        
        if (room.rows.length === 0) {
            return res.status(404).json({ message: 'Кабинет не найден' });
        }
        
        await db.query('DELETE FROM rooms WHERE id = $1', [id]);
        
        res.json({ message: 'Кабинет удален' });
    } catch (err) {
        console.error('DELETE /rooms error:', err);
        res.status(500).json({ message: 'Ошибка удаления кабинета' });
    }
});

// ============= УРОКИ =============

// Получить все уроки
router.get('/lessons', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, description, created_at 
            FROM lessons 
            ORDER BY name
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /lessons error:', err);
        res.json([]);
    }
});

// Добавить урок вручную
router.post('/lessons', async (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Название урока обязательно' });
    }
    
    try {
        const existing = await db.query('SELECT id FROM lessons WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Урок с таким названием уже существует' });
        }
        
        const result = await db.query(
            `INSERT INTO lessons (name, description) VALUES ($1, $2) RETURNING id`,
            [name, description || null]
        );
        
        res.status(201).json({ message: 'Урок добавлен', id: result.rows[0].id });
    } catch (err) {
        console.error('POST /lessons error:', err);
        res.status(500).json({ message: 'Ошибка добавления урока' });
    }
});

// Обновить урок
router.put('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    try {
        const lesson = await db.query('SELECT name FROM lessons WHERE id = $1', [id]);
        if (lesson.rows.length === 0) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await db.query(
            `UPDATE lessons SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [name, description || null, id]
        );
        
        res.json({ message: 'Урок обновлен' });
    } catch (err) {
        console.error('PUT /lessons error:', err);
        res.status(500).json({ message: 'Ошибка обновления урока' });
    }
});

// Удалить урок
router.delete('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const lessonResult = await db.query('SELECT name FROM lessons WHERE id = $1', [id]);
        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await db.query('DELETE FROM lesson_assignments WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM teacher_lessons WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM lessons WHERE id = $1', [id]);
        
        res.json({ message: 'Урок удален' });
    } catch (err) {
        console.error('DELETE /lessons error:', err);
        res.status(500).json({ message: 'Ошибка удаления урока' });
    }
});

// Загрузить уроки из Excel
router.post('/lessons/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не загружен' });
        }
        
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!data || data.length < 2) {
            return res.status(400).json({ message: 'Файл не содержит данных' });
        }
        
        let added = 0;
        let skipped = 0;
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const name = row[0]?.toString().trim();
            
            if (!name) continue;
            
            const description = row[1]?.toString().trim() || null;
            
            const existing = await db.query('SELECT id FROM lessons WHERE name = $1', [name]);
            
            if (existing.rows.length === 0) {
                await db.query(
                    `INSERT INTO lessons (name, description) VALUES ($1, $2)`,
                    [name, description]
                );
                added++;
            } else {
                skipped++;
            }
        }
        
        res.json({ 
            message: `Загрузка завершена. Добавлено: ${added}, Пропущено: ${skipped}`,
            added,
            skipped
        });
    } catch (err) {
        console.error('POST /lessons/upload error:', err);
        res.status(500).json({ message: 'Ошибка загрузки файла: ' + err.message });
    }
});

// ============= НАЗНАЧЕНИЯ УРОКОВ =============

// Получить все назначения уроков
router.get('/lesson-assignments', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                la.id,
                la.lesson_id,
                l.name as lesson_name,
                la.teacher_id,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name,
                la.room_id,
                r.number as room_number,
                la.created_at
            FROM lesson_assignments la
            JOIN lessons l ON la.lesson_id = l.id
            JOIN teachers t ON la.teacher_id = t.id
            JOIN rooms r ON la.room_id = r.id
            ORDER BY la.created_at DESC
        `);
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /lesson-assignments error:', err);
        res.json([]);
    }
});

// Создать назначение урока
router.post('/lesson-assignments', async (req, res) => {
    const { lesson_id, teacher_id, room_id } = req.body;
    
    if (!lesson_id || !teacher_id || !room_id) {
        return res.status(400).json({ message: 'Урок, учитель и кабинет обязательны' });
    }
    
    try {
        const existing = await db.query(
            `SELECT id FROM lesson_assignments 
             WHERE lesson_id = $1 AND teacher_id = $2 AND room_id = $3`,
            [lesson_id, teacher_id, room_id]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Такое назначение уже существует' });
        }
        
        await db.query(
            `INSERT INTO lesson_assignments (lesson_id, teacher_id, room_id) 
             VALUES ($1, $2, $3)`,
            [lesson_id, teacher_id, room_id]
        );
        
        res.status(201).json({ message: 'Урок успешно назначен' });
    } catch (err) {
        console.error('POST /lesson-assignments error:', err);
        res.status(500).json({ message: 'Ошибка назначения урока' });
    }
});

// Удалить назначение урока
router.delete('/lesson-assignments/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM lesson_assignments WHERE id = $1', [id]);
        res.json({ message: 'Назначение удалено' });
    } catch (err) {
        console.error('DELETE /lesson-assignments error:', err);
        res.status(500).json({ message: 'Ошибка удаления назначения' });
    }
});

module.exports = router;