const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qwerty1234',
    database: 'vkr',
});

async function dropConstraint() {
    const client = await pool.connect();
    try {
        // Показываем все ограничения таблицы users
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass
        `);
        
        console.log('Все ограничения таблицы users:');
        constraints.rows.forEach(row => {
            console.log(`  - ${row.conname}: ${row.definition}`);
        });
        
        // Удаляем ограничение на login (пробуем разные варианты)
        const possibleNames = ['users_login_key', 'user_login_unique', 'uq_users_login'];
        
        for (const name of possibleNames) {
            try {
                await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS ${name}`);
                console.log(`✅ Проверено/удалено: ${name}`);
            } catch (e) {
                // игнорируем
            }
        }
        
        console.log('\n✅ Готово! Теперь можно создавать несколько пользователей с одинаковым логином');
        
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

dropConstraint();