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

// ============= КАБИНЕТЫ С ПРИОРИТЕТАМИ =============

// Получить все кабинеты с приоритетными предметами
router.get('/rooms', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                r.id,
                r.number,
                r.name,
                r.priority,
                r.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', lp.id,
                            'lesson_id', lp.lesson_id,
                            'lesson_name', l.name
                        )
                    ) FILTER (WHERE lp.lesson_id IS NOT NULL),
                    '[]'::json
                ) as lesson_priorities
            FROM rooms r
            LEFT JOIN room_lesson_priorities lp ON r.id = lp.room_id
            LEFT JOIN lessons l ON lp.lesson_id = l.id
            GROUP BY r.id
            ORDER BY r.number
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /rooms error:', err);
        res.status(500).json({ message: 'Ошибка загрузки кабинетов: ' + err.message });
    }
});

// Добавить кабинет
router.post('/rooms', async (req, res) => {
    const { number, name, priority, lessonPriorities = [] } = req.body;

    if (!number) {
        return res.status(400).json({ message: 'Номер кабинета обязателен' });
    }

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existing = await client.query('SELECT id FROM rooms WHERE number = $1', [String(number)]);
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Кабинет с таким номером уже существует' });
        }
        
        const result = await client.query(`
            INSERT INTO rooms (number, name, priority)
            VALUES ($1, $2, $3)
            RETURNING id, number, name, priority
        `, [String(number), name || null, parseInt(priority) || 0]);
        
        const roomId = result.rows[0].id;
        
        if (lessonPriorities && lessonPriorities.length > 0) {
            for (const lessonId of lessonPriorities) {
                const cleanLessonId = parseInt(lessonId);
                if (!isNaN(cleanLessonId)) {
                    await client.query(
                        `INSERT INTO room_lesson_priorities (room_id, lesson_id) 
                         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [roomId, cleanLessonId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ message: 'Кабинет добавлен', roomId: roomId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /rooms error:', err);
        res.status(500).json({ message: 'Ошибка добавления кабинета: ' + err.message });
    } finally {
        client.release();
    }
});

// Обновить кабинет
router.put('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { number, name, priority, lessonPriorities = [] } = req.body;

    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existing = await client.query('SELECT id FROM rooms WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Кабинет не найден' });
        }
        
        const duplicateNumber = await client.query(
            'SELECT id FROM rooms WHERE number = $1 AND id != $2',
            [String(number), id]
        );
        if (duplicateNumber.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Кабинет с таким номером уже существует' });
        }
        
        await client.query(`
            UPDATE rooms SET 
                number = $1, 
                name = $2, 
                priority = $3
            WHERE id = $4
        `, [String(number), name || null, parseInt(priority) || 0, id]);
        
        await client.query('DELETE FROM room_lesson_priorities WHERE room_id = $1', [id]);
        
        if (lessonPriorities && lessonPriorities.length > 0) {
            for (const lessonId of lessonPriorities) {
                const cleanLessonId = parseInt(lessonId);
                if (!isNaN(cleanLessonId)) {
                    await client.query(
                        `INSERT INTO room_lesson_priorities (room_id, lesson_id) 
                         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [id, cleanLessonId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ message: 'Кабинет обновлен' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('PUT /rooms error:', err);
        res.status(500).json({ message: 'Ошибка обновления кабинета: ' + err.message });
    } finally {
        client.release();
    }
});

// Удалить кабинет
router.delete('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const room = await client.query('SELECT number FROM rooms WHERE id = $1', [id]);
        
        if (room.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Кабинет не найден' });
        }
        
        await client.query('DELETE FROM room_lesson_priorities WHERE room_id = $1', [id]);
        await client.query('DELETE FROM rooms WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Кабинет удален' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /rooms error:', err);
        res.status(500).json({ message: 'Ошибка удаления кабинета' });
    } finally {
        client.release();
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
            `INSERT INTO lessons (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at`,
            [name, description || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /lessons error:', err);
        res.status(500).json({ message: 'Ошибка добавления урока' });
    }
});

// Обновить урок (ИСПРАВЛЕНО - убран updated_at)
router.put('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    try {
        const lesson = await db.query('SELECT name FROM lessons WHERE id = $1', [id]);
        if (lesson.rows.length === 0) {
            return res.status(404).json({ message: 'Урок не найден' });
        }
        
        await db.query(
            `UPDATE lessons SET name = $1, description = $2 WHERE id = $3`,
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
        
        await db.query('DELETE FROM room_lesson_priorities WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM lesson_assignments WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM teacher_lessons WHERE lesson_id = $1', [id]);
        await db.query('DELETE FROM lessons WHERE id = $1', [id]);
        
        res.json({ message: 'Урок удален' });
    } catch (err) {
        console.error('DELETE /lessons error:', err);
        res.status(500).json({ message: 'Ошибка удаления урока' });
    }
});

// Массовое удаление уроков
router.delete('/lessons/bulk', async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Не указаны ID уроков для удаления' });
    }
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        for (const id of ids) {
            await client.query('DELETE FROM room_lesson_priorities WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM lesson_assignments WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM teacher_lessons WHERE lesson_id = $1', [id]);
            await client.query('DELETE FROM lessons WHERE id = $1', [id]);
        }
        
        await client.query('COMMIT');
        
        res.json({ message: `Удалено ${ids.length} уроков`, count: ids.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /lessons/bulk error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// Экспорт уроков в Excel
router.get('/lessons/export', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, description, created_at FROM lessons ORDER BY name');
        
        const wsData = [
            ['ID', 'Название урока', 'Описание', 'Дата создания'],
            ...result.rows.map(lesson => [
                lesson.id,
                lesson.name,
                lesson.description || '',
                lesson.created_at ? new Date(lesson.created_at).toLocaleString('ru-RU') : ''
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:8}, {wch:30}, {wch:40}, {wch:20}];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Уроки');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=lessons_export.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('GET /lessons/export error:', err);
        res.status(500).json({ message: err.message });
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
            LEFT JOIN rooms r ON la.room_id = r.id
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
    
    if (!lesson_id || !teacher_id) {
        return res.status(400).json({ message: 'Урок и учитель обязательны' });
    }
    
    try {
        const existing = await db.query(
            `SELECT id FROM lesson_assignments 
             WHERE lesson_id = $1 AND teacher_id = $2 AND (room_id = $3 OR ($3 IS NULL AND room_id IS NULL))`,
            [lesson_id, teacher_id, room_id || null]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Такое назначение уже существует' });
        }
        
        await db.query(
            `INSERT INTO lesson_assignments (lesson_id, teacher_id, room_id) 
             VALUES ($1, $2, $3)`,
            [lesson_id, teacher_id, room_id || null]
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

// ============= МАССОВЫЕ ОПЕРАЦИИ =============

// Получить статистику по урокам
router.get('/lessons/stats', async (req, res) => {
    try {
        const totalResult = await db.query('SELECT COUNT(*) as total FROM lessons');
        const withDescResult = await db.query('SELECT COUNT(*) as count FROM lessons WHERE description IS NOT NULL AND description != \'\'');
        
        res.json({
            total: parseInt(totalResult.rows[0]?.total || 0),
            withDescription: parseInt(withDescResult.rows[0]?.count || 0)
        });
    } catch (err) {
        console.error('GET /lessons/stats error:', err);
        res.json({ total: 0, withDescription: 0 });
    }
});

// ============= НАЧАТЬ НОВЫЙ УЧЕБНЫЙ ГОД =============

router.post('/start-new-school-year', async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classesResult = await client.query(`
            SELECT id, number, letter, teacher_id, shift 
            FROM classes 
            ORDER BY number, letter
        `);
        
        const existingClasses = classesResult.rows;
        
        const classesToUpgrade = [];
        const classesToRelease = [];
        
        existingClasses.forEach(cls => {
            if (cls.number === 11) {
                classesToRelease.push(cls);
            } else if (cls.number >= 1 && cls.number <= 10) {
                classesToUpgrade.push(cls);
            }
        });
        
        for (const cls of classesToRelease) {
            await client.query(
                'UPDATE classes SET teacher_id = NULL WHERE id = $1',
                [cls.id]
            );
        }
        
        const sortedClasses = [...classesToUpgrade].sort((a, b) => b.number - a.number);
        
        for (const cls of sortedClasses) {
            const newNumber = cls.number + 1;
            await client.query(
                'UPDATE classes SET number = $1 WHERE id = $2',
                [newNumber, cls.id]
            );
        }
        
        const firstClassesResult = await client.query(`
            SELECT DISTINCT letter 
            FROM classes 
            WHERE number = 1
        `);
        
        const existingLetters = firstClassesResult.rows.map(r => r.letter);
        const defaultLetters = ['А', 'Б', 'В', 'Г'];
        
        for (const letter of defaultLetters) {
            const exists = existingLetters.includes(letter);
            
            if (!exists) {
                const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
                const password = `class${letter}123`;
                const passwordHash = await bcrypt.hash(password, 10);
                
                const userResult = await client.query(
                    'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                    [login, passwordHash, 'class']
                );
                
                const userId = userResult.rows[0].id;
                
                await client.query(`
                    INSERT INTO classes (number, letter, shift, teacher_id, user_id)
                    VALUES ($1, $2, $3, $4, $5)
                `, [1, letter, 1, null, userId]);
            }
        }
        
        await client.query(`
            INSERT INTO activity_log (user_id, action, details, created_at)
            VALUES ($1, $2, $3, NOW())
        `, [req.user.id, 'start_new_school_year', JSON.stringify({
            upgradedClasses: classesToUpgrade.length,
            releasedClasses: classesToRelease.length,
            timestamp: new Date().toISOString()
        })]);
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Новый учебный год начат',
            details: {
                upgraded: classesToUpgrade.length,
                released: classesToRelease.length,
                newFirstClasses: defaultLetters.filter(l => !existingLetters.includes(l)).length
            }
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /start-new-school-year error:', err);
        res.status(500).json({ 
            message: 'Ошибка при начале нового учебного года: ' + err.message 
        });
    } finally {
        client.release();
    }
});

module.exports = router;