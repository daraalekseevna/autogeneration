// backend/models/database.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Переменная окружения DATABASE_URL не задана!');
    console.error('Добавьте DATABASE_URL в Environment Variables на Render');
}

let poolConfig;

if (connectionString) {
    // Продакшен (Render) — используем DATABASE_URL с правильными настройками SSL
    poolConfig = {
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Отключает строгую проверку сертификата (нужно для Supabase)
        }
    };
    console.log('DATABASE_URL');
} else {
    // Локальная разработка — используем локальные настройки
    poolConfig = {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'qwerty1234',
        database: 'vkr'
    };
    console.log('🔗 Подключение к локальной БД (localhost)');
}

const pool = new Pool(poolConfig);

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