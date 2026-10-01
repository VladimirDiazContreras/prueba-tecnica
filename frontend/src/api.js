const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:300';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend esté iniciado.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'La solicitud no pudo completarse.');
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  getProjects: () => request('/projects'),
  createProject: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
  getProjectTasks: (projectId) => request(`/projects/${projectId}/tasks`),
  createTask: (projectId, task) => request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(task) }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
