// routes/newSchoolYear.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

// ============= НОВЫЙ УЧЕБНЫЙ ГОД - 5 ШАГОВ =============

// ШАГ 1: Выпустить 11 классы
router.post('/graduate-11-classes', async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classesResult = await client.query(`
            SELECT id, number, letter, teacher_id
            FROM classes 
            WHERE number = 11
            ORDER BY letter
        `);
        
        for (const cls of classesResult.rows) {
            await client.query(
                'UPDATE classes SET teacher_id = NULL WHERE id = $1',
                [cls.id]
            );
        }
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `${classesResult.rows.length} одиннадцатых классов выпущено`,
            graduatedClasses: classesResult.rows.map(c => `${c.number}${c.letter}`)
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /graduate-11-classes error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// ШАГ 2: Перевести все классы на следующий уровень
router.post('/promote-all-classes', async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        await client.query('UPDATE classes SET number = 99 WHERE number = 11');
        
        for (let num = 10; num >= 1; num--) {
            await client.query(
                'UPDATE classes SET number = number + 1 WHERE number = $1',
                [num]
            );
        }
        
        const deletedResult = await client.query('DELETE FROM classes WHERE number = 99 RETURNING id');
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Все классы переведены.`,
            deletedCount: deletedResult.rowCount
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /promote-all-classes error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// Получить 5 классы для назначения новых руководителей
router.get('/fifth-classes-for-assign', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.id, c.number, c.letter, c.teacher_id,
                   CONCAT(c.number, c.letter) as name,
                   CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as current_teacher_name
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            WHERE c.number = 5
            ORDER BY c.letter
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /fifth-classes-for-assign error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Получить свободных учителей (не классных руководителей) для 5 классов
router.get('/available-teachers-for-fifth', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.id, CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name
            FROM teachers t
            WHERE t.id NOT IN (SELECT DISTINCT teacher_id FROM classes WHERE teacher_id IS NOT NULL AND number != 5)
            ORDER BY t.last_name
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /available-teachers-for-fifth error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ШАГ 3: Назначить НОВЫХ руководителей для 5 классов и вернуть СТАРЫХ учителей
router.post('/assign-fifth-class-teachers', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // 🔥 1. СНАЧАЛА получаем СТАРЫХ учителей (тех, кого будем заменять)
        const releasedTeachers = [];
        for (const assign of assignments) {
            const oldTeacherResult = await client.query(`
                SELECT 
                    c.id as class_id,
                    c.letter,
                    c.teacher_id as old_teacher_id,
                    CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as old_teacher_name
                FROM classes c
                LEFT JOIN teachers t ON c.teacher_id = t.id
                WHERE c.id = $1
            `, [assign.classId]);
            
            if (oldTeacherResult.rows.length > 0 && oldTeacherResult.rows[0].old_teacher_id) {
                releasedTeachers.push({
                    class_id: assign.classId,
                    letter: oldTeacherResult.rows[0].letter,
                    teacher_id: oldTeacherResult.rows[0].old_teacher_id,
                    teacher_name: oldTeacherResult.rows[0].old_teacher_name,
                    old_class: `5${oldTeacherResult.rows[0].letter}`
                });
            }
        }
        
        // 2. Назначаем НОВЫХ учителей для 5 классов
        for (const assign of assignments) {
            await client.query(
                'UPDATE classes SET teacher_id = $1 WHERE id = $2',
                [assign.teacherId || null, assign.classId]
            );
        }
        
        await client.query('COMMIT');
        
        // 3. Возвращаем СТАРЫХ учителей (которых заменили)
        res.json({ 
            success: true, 
            message: `Назначено ${assignments.length} новых руководителей для 5 классов`,
            releasedTeachers: releasedTeachers  // 🔥 ВОЗВРАЩАЕМ СТАРЫХ!
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /assign-fifth-class-teachers error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// СОЗДАТЬ НОВЫЕ 1 КЛАССЫ
router.post('/create-first-classes', async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const existingFirstClasses = await client.query(`
            SELECT letter FROM classes WHERE number = 1
        `);
        const existingLetters = existingFirstClasses.rows.map(r => r.letter);
        
        const fifthClasses = await client.query(`
            SELECT DISTINCT letter FROM classes WHERE number = 5 ORDER BY letter
        `);
        
        let lettersToCreate = fifthClasses.rows.map(r => r.letter);
        if (lettersToCreate.length === 0) {
            lettersToCreate = ['А', 'Б', 'В', 'Г'];
        }
        
        let createdCount = 0;
        const createdClasses = [];
        
        for (const letter of lettersToCreate) {
            if (!existingLetters.includes(letter)) {
                const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
                const password = `class${letter}123`;
                const passwordHash = await bcrypt.hash(password, 10);
                
                const userResult = await client.query(
                    'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                    [login, passwordHash, 'class']
                );
                
                const userId = userResult.rows[0].id;
                
                const classResult = await client.query(`
                    INSERT INTO classes (number, letter, shift, teacher_id, user_id)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, number, letter
                `, [1, letter, 1, null, userId]);
                
                createdCount++;
                createdClasses.push(classResult.rows[0]);
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Создано ${createdCount} новых первых классов`,
            createdCount,
            createdClasses
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /create-first-classes error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// 🔥 ИСПРАВЛЕННЫЙ: Получить ОСВОБОДИВШИХСЯ учителей (тех, кого ЗАМЕНИЛИ)
// Для этого нужно сохранять старых учителей ВРЕМЕННО в памяти или в таблице
// Но проще передать их через фронтенд из ответа assign-fifth-class-teachers
// Этот эндпоинт теперь возвращает данные из временного хранилища
// Для простоты - будем хранить в глобальной переменной (только для текущей сессии)
let tempReleasedTeachers = [];

// Временное хранилище для освободившихся учителей
router.post('/store-released-teachers', (req, res) => {
    const { releasedTeachers } = req.body;
    tempReleasedTeachers = releasedTeachers;
    res.json({ success: true });
});

router.get('/released-teachers', async (req, res) => {
    // Возвращаем сохранённых освободившихся учителей
    res.json(tempReleasedTeachers);
});

// Получить новые 1 классы
router.get('/first-classes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.id, c.number, c.letter,
                   CONCAT(c.number, c.letter) as name,
                   c.teacher_id
            FROM classes c
            WHERE c.number = 1
            ORDER BY c.letter
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /first-classes error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Получить всех учителей для выпадающего списка
router.get('/all-teachers-for-select', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.id, CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as name
            FROM teachers t
            ORDER BY t.last_name
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /all-teachers-for-select error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Удалить 1 класс
router.delete('/delete-first-class/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const classResult = await client.query('SELECT user_id FROM classes WHERE id = $1 AND number = 1', [id]);
        
        if (classResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Класс не найден' });
        }
        
        const userId = classResult.rows[0].user_id;
        
        await client.query('DELETE FROM classes WHERE id = $1', [id]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        await client.query('COMMIT');
        
        res.json({ success: true, message: 'Класс удалён' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /delete-first-class error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// Добавить новый 1 класс
router.post('/add-first-class', async (req, res) => {
    const { letter, teacherId } = req.body;
    const client = await db.getClient();
    
    if (!letter) {
        return res.status(400).json({ message: 'Буква класса обязательна' });
    }
    
    try {
        await client.query('BEGIN');
        
        const existing = await client.query(
            'SELECT id FROM classes WHERE number = 1 AND letter = $1',
            [letter.toUpperCase()]
        );
        
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Класс 1${letter} уже существует` });
        }
        
        const login = `class_1${letter.toLowerCase()}_${Date.now()}`;
        const password = `class${letter}123`;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const userResult = await client.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            [login, passwordHash, 'class']
        );
        
        const userId = userResult.rows[0].id;
        
        const classResult = await client.query(`
            INSERT INTO classes (number, letter, shift, teacher_id, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, number, letter
        `, [1, letter.toUpperCase(), 1, teacherId || null, userId]);
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Класс 1${letter} добавлен`,
            newClass: classResult.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /add-first-class error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// ШАГ 4: Сохранить назначения для 1 классов
router.post('/assign-first-class-teachers', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        let updatedCount = 0;
        
        for (const assign of assignments) {
            if (assign.teacherId && assign.teacherId !== '') {
                await client.query(
                    'UPDATE classes SET teacher_id = $1 WHERE id = $2 AND number = 1',
                    [assign.teacherId, assign.classId]
                );
                updatedCount++;
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Назначено ${updatedCount} классных руководителей для 1 классов`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /assign-first-class-teachers error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// Получить все классы для финального preview
router.get('/final-classes-preview', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.id, c.number, c.letter, c.teacher_id,
                   CONCAT(c.number, c.letter) as class_name,
                   CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name
            FROM classes c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            ORDER BY c.number, c.letter
        `);
        
        res.json(result.rows || []);
    } catch (err) {
        console.error('GET /final-classes-preview error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ШАГ 5: Сохранить финальные изменения
router.post('/save-final-assignments', async (req, res) => {
    const { assignments } = req.body;
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        let updatedCount = 0;
        
        for (const assign of assignments) {
            if (assign.teacherId && assign.teacherId !== '') {
                await client.query(
                    'UPDATE classes SET teacher_id = $1 WHERE id = $2',
                    [assign.teacherId, assign.classId]
                );
                updatedCount++;
            }
        }
        
        await client.query('COMMIT');
        
        // Очищаем временное хранилище
        tempReleasedTeachers = [];
        
        res.json({ 
            success: true, 
            message: `Сохранено ${updatedCount} назначений`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /save-final-assignments error:', err);
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;