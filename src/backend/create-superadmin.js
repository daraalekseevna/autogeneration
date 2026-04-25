const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qwerty1234',
    database: 'vkr',
});

async function createSuperAdmin() {
    const login = 'superadmin';
    const password = 'superadmin123';
    
    // Генерируем хеш пароля
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    console.log('Хеш пароля:', passwordHash);
    
    try {
        // Удаляем старого если есть
        await pool.query('DELETE FROM users WHERE login = $1', [login]);
        
        // Создаем суперадмина
        await pool.query(
            'INSERT INTO users (login, password_hash, role) VALUES ($1, $2, $3)',
            [login, passwordHash, 'superadmin']
        );
        
        console.log('✅ Суперадмин успешно создан!');
        console.log('📝 Логин: superadmin');
        console.log('📝 Пароль: superadmin123');
        
        // Проверяем, что пользователь создан
        const result = await pool.query('SELECT login, role FROM users WHERE login = $1', [login]);
        console.log('✅ Проверка:', result.rows[0]);
        
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    } finally {
        await pool.end();
    }
}

createSuperAdmin();