// models/ScheduleVersion.js
const db = require('../models/database');

class ScheduleVersion {
    static async createVersion(userId, description = '') {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Получаем последний номер версии
            const lastVersion = await client.query(
                'SELECT COALESCE(MAX(version_number), 0) as max_version FROM schedule_versions'
            );
            const newVersionNumber = lastVersion.rows[0].max_version + 1;
            
            // Создаем новую версию
            const result = await client.query(
                `INSERT INTO schedule_versions (version_number, created_by, status, description)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [newVersionNumber, userId, 'draft', description]
            );
            
            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async publishVersion(versionId, userId, validFrom, validTo) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Обновляем статус версии
            await client.query(
                `UPDATE schedule_versions 
                 SET status = 'published', valid_from = $1, valid_to = $2
                 WHERE id = $3`,
                [validFrom, validTo, versionId]
            );
            
            // Копируем данные в active_schedule
            await client.query('DELETE FROM active_schedule');
            
            await client.query(`
                INSERT INTO active_schedule (version_id, class_id, day_of_week, lesson_number, subject_id, teacher_id, room)
                SELECT $1, class_id, day_of_week, lesson_number, subject_id, teacher_id, room
                FROM lesson_schedule
                WHERE version_id = $1
            `, [versionId]);
            
            // Обновляем lesson_schedule статус публикации
            await client.query(
                'UPDATE lesson_schedule SET is_published = TRUE, version_id = $1 WHERE version_id = $1',
                [versionId]
            );
            
            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getCurrentActiveSchedule() {
        const result = await db.query(`
            SELECT 
                a.*,
                c.number as class_number,
                c.letter as class_letter,
                l.name as subject_name,
                CONCAT(t.last_name, ' ', t.first_name, ' ', COALESCE(t.middle_name, '')) as teacher_name
            FROM active_schedule a
            JOIN classes c ON a.class_id = c.id
            JOIN lessons l ON a.subject_id = l.id
            JOIN teachers t ON a.teacher_id = t.id
            ORDER BY c.number, c.letter, a.day_of_week, a.lesson_number
        `);
        return result.rows;
    }

    static async getVersions() {
        const result = await db.query(`
            SELECT 
                v.*,
                u.login as created_by_login
            FROM schedule_versions v
            LEFT JOIN users u ON v.created_by = u.id
            ORDER BY v.version_number DESC
        `);
        return result.rows;
    }

    static async getScheduleChanges(versionId) {
        const result = await db.query(`
            SELECT 
                sc.*,
                c.number as class_number,
                c.letter as class_letter,
                old_l.name as old_subject_name,
                new_l.name as new_subject_name,
                old_t.last_name as old_teacher_last_name,
                old_t.first_name as old_teacher_first_name,
                new_t.last_name as new_teacher_last_name,
                new_t.first_name as new_teacher_first_name,
                u.login as changed_by_login
            FROM schedule_changes sc
            JOIN classes c ON sc.class_id = c.id
            LEFT JOIN lessons old_l ON sc.old_subject_id = old_l.id
            LEFT JOIN lessons new_l ON sc.new_subject_id = new_l.id
            LEFT JOIN teachers old_t ON sc.old_teacher_id = old_t.id
            LEFT JOIN teachers new_t ON sc.new_teacher_id = new_t.id
            LEFT JOIN users u ON sc.changed_by = u.id
            WHERE sc.version_id = $1
            ORDER BY sc.changed_at DESC
        `, [versionId]);
        return result.rows;
    }
}

module.exports = ScheduleVersion;