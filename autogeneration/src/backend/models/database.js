// models/database.js
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qwerty1234',
    database: 'vkr',
});

// Проверка подключения
pool.on('connect', () => {
    console.log('📦 Подключено к PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Ошибка PostgreSQL:', err);
});

module.exports = {
    // Обычный запрос
    query: (text, params) => pool.query(text, params),
    
    // Получить клиента для транзакций
    getClient: async () => {
        const client = await pool.connect();
        return client;
    },
    
    // Получить пул
    getPool: () => pool,
    
    // Закрыть все подключения
    close: () => pool.end()
};