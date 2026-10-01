# Workspace — proyectos y tareas

Aplicación sencilla para organizar proyectos y sus tareas. El frontend está construido con React y Vite; la API usa Node.js, Express y PostgreSQL.

## Requisitos

- Node.js 20 o posterior y npm.
- PostgreSQL en ejecución y una base de datos creada.
- Credenciales de PostgreSQL configuradas en `backend/.env`.

## Estructura del proyecto

```text
.
├── backend/
│   ├── config/db.js                 # Pool de conexión PostgreSQL
│   ├── controllers/task_controller.js
│   ├── db/schema.sql                # Esquema SQL de referencia
│   ├── scripts/check-db.js          # Comprobación de conexión
│   ├── app.js                       # Rutas e inicio de la API
│   └── .env.example                 # Plantilla de configuración
├── frontend/
│   └── src/
│       ├── api.js                   # Cliente HTTP de la API
│       ├── App.jsx                  # Inicio, proyectos desplegables y tareas
│       └── styles.css
└── .gitignore
```

## Base de datos

La base usa dos tablas relacionadas por `tasks.project_id`:

```sql
CREATE TABLE projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL CHECK (length(trim(name)) > 0)
);

CREATE TABLE tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
```

Al iniciar, el backend crea las tablas e índice si no existen. También convierte los estados antiguos en español a sus valores internos actuales: `Pendiente` → `pending`, `En progreso` → `in_progress`, `Completada` → `done`.

## Configuración

Copia `backend/.env.example` a `backend/.env` y pon los valores de tu servidor PostgreSQL. No subas `.env` ni credenciales al repositorio; el `.gitignore` ya excluye esos archivos.

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_clave
DB_NAME=gestion_proyectos
PORT=300
FRONTEND_ORIGIN=http://localhost:5173
```

El backend también reconoce las variables minúsculas y algunos nombres heredados (`db_host`, `bd_port`, `db_user`, `db_pssword`, `db_name`, `port`) del `.env` existente.

## Ejecutar localmente

Terminal 1 — API:

```powershell
cd backend
npm install
npm run db:check
npm run dev
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite muestra la URL local, normalmente `http://localhost:5173`. El frontend usa por defecto `http://localhost:300` para la API. Para cambiarla, crea `frontend/.env.local` con `VITE_API_URL=http://localhost:3001` (o la URL de tu API); ese archivo también queda ignorado por Git.

El endpoint `GET /api/health` devuelve el estado de la API y de PostgreSQL. `npm run db:check` verifica la conexión desde el backend.

## API REST

Las rutas solicitadas no tienen prefijo `/api`. El prefijo solo se usa para la comprobación de salud.

| Método y ruta | Descripción | Cuerpo / respuesta |
|---|---|---|
| `GET /projects` | Lista los proyectos y el total de tareas por proyecto. | `[{ "id": "1", "name": "Portal", "task_count": 2 }]` |
| `GET /projects/:id/tasks` | Lista tareas del proyecto. Usa `INNER JOIN` entre `tasks` y `projects`. | Cada tarea incluye `id`, `title`, `status`, `project_id` y `project_name`. |
| `POST /projects/:id/tasks` | Crea una tarea asociada al proyecto. | `{"title":"Preparar prototipo"}`; admite `status` opcional. Devuelve `201`. |
| `PATCH /tasks/:id` | Actualiza solo el estado de la tarea. | `{"status":"done"}`. |
| `DELETE /tasks/:id` | Elimina la tarea. | Devuelve `204` si se eliminó. |

Valores admitidos para `status`: `pending`, `in_progress` y `done`. La interfaz los presenta como “Pendiente”, “En progreso” y “Completada”. La creación rechaza títulos vacíos o con espacios solamente. Un ID inválido devuelve `400`; un proyecto o tarea inexistente devuelve `404`; errores inesperados de base de datos devuelven `500`.

### Ejemplos con `curl`

```bash
# Listar proyectos
curl http://localhost:300/projects

# Consultar tareas del proyecto 1
curl http://localhost:300/projects/1/tasks

# Crear tarea (un título vacío devuelve 400)
curl -X POST http://localhost:300/projects/1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Preparar prototipo"}'

# Marcar como completada
curl -X PATCH http://localhost:300/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# Eliminar tarea
curl -X DELETE http://localhost:300/tasks/1
```

La aplicación además usa `POST /projects` para crear proyectos desde su pantalla de inicio. Esta ruta valida que `name` no esté vacío.

## Interfaz

El inicio presenta tarjetas desplegables de proyectos. Dentro de cada proyecto se listan sus tareas, se puede crear una tarea, avanzar su estado con `PATCH`, eliminarla, filtrar por estado y buscar por título. El frontend carga los proyectos mediante `GET /projects` y las tareas mediante una petición `GET /projects/:id/tasks` por proyecto.

## Scripts npm

Backend:

- `npm run dev`: inicia la API con recarga al cambiar archivos.
- `npm start`: inicia la API.
- `npm run db:check`: verifica conexión PostgreSQL.

Frontend:

- `npm run dev`: inicia Vite.
- `npm run build`: genera el frontend de producción en `frontend/dist`.
- `npm run preview`: sirve localmente el build.
