const pool = require('../config/db');

async function check() {
  try {
    const { rows } = await pool.query('SELECT current_database() AS database, version() AS version');
    console.log(`Conexión PostgreSQL correcta. Base: ${rows[0].database}`);
    console.log(rows[0].version.split('\n')[0]);
  } catch (error) {
    console.error('No fue posible conectar con PostgreSQL:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

check();
