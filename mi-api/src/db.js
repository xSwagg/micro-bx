const mysql = require('mysql2/promise');
require('dotenv').config();

// createPool: reutiliza conexiones automáticamente
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: process.env.DB_POOL_LIMIT || 10,
  waitForConnections: true,
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado');
    conn.release(); // devolver al pool
  })
  .catch(err => {
    console.error('❌ Error MySQL:', err.message);
    process.exit(1); // detener app si no hay DB
  });

module.exports = pool;