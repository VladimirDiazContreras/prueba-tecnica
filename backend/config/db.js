require('dotenv').config();
const { Pool } = require('pg');

// Accept the corrected variable names and the legacy misspellings in the
// existing local .env file so the connection can be repaired without exposing
// or copying database credentials into source control.
const pool = new Pool({
  host: process.env.DB_HOST || process.env.db_host,
  port: Number(process.env.DB_PORT || process.env.db_port || process.env.bd_port || 5432),
  user: process.env.DB_USER || process.env.db_user,
  password: process.env.DB_PASSWORD || process.env.db_password || process.env.db_pssword,
  database: process.env.DB_NAME || process.env.db_name,
});

pool.on('error', (error) => console.error('Error inesperado en el pool de PostgreSQL:', error.message));

module.exports = pool;
