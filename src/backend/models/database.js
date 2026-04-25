const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qwerty1234',
    database: 'vkr',
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};