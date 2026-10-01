const express = require('express');
const pool = require('./config/db');
const taskController = require('./controllers/task_controller');

const app = express();
const PORT = Number(process.env.PORT || process.env.port || 3001);

app.use(express.json());
// The development frontend runs on Vite's default port.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT current_database() AS database, NOW() AS connected_at');
    res.json({ api: 'ok', database: 'connected', databaseName: result.rows[0].database });
  } catch (error) {
    console.error('PostgreSQL health check failed:', error.message);
    res.status(503).json({ api: 'ok', database: 'disconnected', error: 'No se pudo conectar con PostgreSQL.' });
  }
});

app.get('/projects', taskController.listProjects);
// Creating projects remains available to the home screen.
app.post('/projects', taskController.createProject);
app.get('/projects/:id/tasks', taskController.listProjectTasks);
app.post('/projects/:id/tasks', taskController.createProjectTask);
app.patch('/tasks/:id', taskController.updateTaskStatus);
app.delete('/tasks/:id', taskController.deleteTask);

async function start() {
  try {
    await pool.query('SELECT 1');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(150) NOT NULL CHECK (length(trim(name)) > 0)
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
      );
      ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending';
      CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
      UPDATE tasks SET status = CASE status
        WHEN 'Pendiente' THEN 'pending'
        WHEN 'En progreso' THEN 'in_progress'
        WHEN 'Completada' THEN 'done'
        ELSE status
      END
      WHERE status IN ('Pendiente', 'En progreso', 'Completada');
    `);
    app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
  } catch (error) {
    console.error('No se pudo iniciar la API o preparar el esquema PostgreSQL:', error.message);
    process.exitCode = 1;
    await pool.end();
  }
}

if (require.main === module) start();
module.exports = { app, start };
