// ============================================================
// Database connection pool (MySQL via mysql2/promise)
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'save_it_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true // return DECIMAL columns as JS numbers, not strings
});

// Quick connectivity check used at server startup
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        console.log('✅ MySQL connection pool established.');
        return true;
    } catch (err) {
        console.error('❌ Could not connect to MySQL:', err.message);
        return false;
    }
}

module.exports = { pool, testConnection };
