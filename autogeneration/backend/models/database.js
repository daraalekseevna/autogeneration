// backend/models/database.js
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qwerty1234',
    database: 'vkr',
});

pool.on('connect', () => {
    console.log('✅ Подключено к PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Ошибка PostgreSQL:', err);
});

// Функция для выполнения запросов
const query = (text, params) => pool.query(text, params);

// Функция для получения клиента (транзакции)
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

// Функция проверки подключения
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ База данных успешно подключена');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        return false;
    }
};

// Получить пул
const getPool = () => pool;

// Закрыть соединение
const close = () => pool.end();

module.exports = {
    query,
    getClient,
    testConnection,
    getPool,
    close
};