const pool = require('../config/db');
const TASK_STATUSES = new Set(['pending', 'in_progress', 'done']);

function validId(value) {
  if (!/^\d+$/.test(String(value))) return false;
  const id = BigInt(value);
  return id > 0n && id <= 9223372036854775807n;
}

function handleError(res, error) {
  console.error('Database request failed:', error.message);
  if (error.code === '23503') return res.status(404).json({ error: 'No existe el proyecto indicado.' });
  if (error.code === '23514' || error.code === '23502') return res.status(400).json({ error: 'Los datos enviados no son válidos.' });
  return res.status(500).json({ error: 'Ocurrió un error al consultar la base de datos.' });
}

async function listProjects(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.name, COUNT(t.id)::int AS task_count
      FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id ORDER BY p.id
    `);
    res.json(rows);
  } catch (error) { handleError(res, error); }
}

async function createProject(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 150) return res.status(400).json({ error: 'El nombre es obligatorio y debe tener máximo 150 caracteres.' });
  try {
    const { rows } = await pool.query('INSERT INTO projects(name) VALUES ($1) RETURNING id, name', [name]);
    res.status(201).json(rows[0]);
  } catch (error) { handleError(res, error); }
}

async function listProjectTasks(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'El id del proyecto debe ser un entero positivo.' });
  try {
    const { rows } = await pool.query(`
      SELECT t.id, t.title, t.status, t.project_id, p.name AS project_name
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      WHERE p.id = $1
      ORDER BY t.id DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) { handleError(res, error); }
}

async function createProjectTask(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'El id del proyecto debe ser un entero positivo.' });
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'El título de la tarea no puede estar vacío.' });
  if (title.length > 255) return res.status(400).json({ error: 'El título no puede superar 255 caracteres.' });
  const status = req.body?.status ?? 'pending';
  if (!TASK_STATUSES.has(status)) return res.status(400).json({ error: 'El estado debe ser pending, in_progress o done.' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO tasks(title, status, project_id)
      SELECT $1, $2, p.id FROM projects p WHERE p.id = $3
      RETURNING id, title, status, project_id
    `, [title, status, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'No existe el proyecto indicado.' });
    res.status(201).json(rows[0]);
  } catch (error) { handleError(res, error); }
}

async function updateTaskStatus(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'El id de la tarea debe ser un entero positivo.' });
  const status = req.body?.status;
  if (!TASK_STATUSES.has(status)) return res.status(400).json({ error: 'El estado debe ser pending, in_progress o done.' });
  try {
    const { rows } = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING id, title, status, project_id',
      [status, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'No se encontró la tarea.' });
    res.json(rows[0]);
  } catch (error) { handleError(res, error); }
}

async function deleteTask(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'El id de la tarea debe ser un entero positivo.' });
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'No se encontró la tarea.' });
    res.status(204).end();
  } catch (error) { handleError(res, error); }
}

module.exports = { listProjects, createProject, listProjectTasks, createProjectTask, updateTaskStatus, deleteTask };
