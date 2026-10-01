import { useEffect, useState } from 'react';
import { Bell, Check, ChevronDown, CircleHelp, FolderKanban, LayoutDashboard, ListTodo, MoreHorizontal, Plus, Search, Settings2, SlidersHorizontal, X, Sparkles, CircleDot } from 'lucide-react';
import { api } from './api.js';
const statusClass = { pending: 'pending', in_progress: 'progress', done: 'done' };
const statusLabel = { pending: 'Pendiente', in_progress: 'En progreso', done: 'Completada' };

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState([]);

  async function reloadData() {
    setApiError('');
    try {
      const projectRows = await api.getProjects();
      const taskGroups = await Promise.all(projectRows.map((project) => api.getProjectTasks(project.id)));
      const taskRows = taskGroups.flat();
      setProjects(projectRows);
      setTasks(taskRows);
      setProjectFilter((current) => current !== 'all' && !projectRows.some((project) => String(project.id) === current) ? 'all' : current);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reloadData(); }, []);

  const visibleProjects = projects.filter((project) => projectFilter === 'all' || String(project.id) === projectFilter);
  const counts = {
    total: tasks.length,
    progress: tasks.filter((task) => task.status === 'in_progress').length,
    done: tasks.filter((task) => task.status === 'done').length,
  };

  async function addProject(event) {
    event.preventDefault();
    if (!projectName.trim()) return;
    try {
      const project = await api.createProject({ name: projectName.trim() });
      setProjects((current) => [...current, project]);
      setProjectFilter(String(project.id));
      setExpandedProjects((current) => [...new Set([...current, String(project.id)])]);
      setProjectName(''); setModal(null); setApiError('');
    } catch (error) { setApiError(error.message); }
  }
  async function addTask(event) {
    event.preventDefault();
    if (!taskTitle.trim() || !taskProject) return;
    try {
      const task = { title: taskTitle.trim(), status: taskStatus };
      await api.createTask(taskProject, task);
      await reloadData();
      setTaskTitle(''); setModal(null);
    } catch (error) { setApiError(error.message); }
  }
  async function cycleStatus(task) {
    const order = ['pending', 'in_progress', 'done'];
    const status = order[(order.indexOf(task.status) + 1) % order.length];
    try { await api.updateTaskStatus(task.id, status); await reloadData(); }
    catch (error) { setApiError(error.message); }
  }
  async function deleteTask(task) {
    if (!window.confirm(`¿Eliminar la tarea «${task.title}»?`)) return;
    try { await api.deleteTask(task.id); await reloadData(); }
    catch (error) { setApiError(error.message); }
  }
  function closeModal() { setModal(null); setTaskTitle(''); setProjectName(''); }
  function toggleProject(projectId) {
    setExpandedProjects((current) => current.includes(String(projectId)) ? current.filter((id) => id !== String(projectId)) : [...current, String(projectId)]);
  }
  const currentProject = projectFilter === 'all' ? 'Todos los proyectos' : projects.find((project) => String(project.id) === projectFilter)?.name;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-mark"><FolderKanban size={19}/></span><span>work<span className="brand-light">space</span></span></a>
      <div className="workspace-switch"><span className="workspace-avatar">N</span><span className="workspace-copy"><b>Northstar Studio</b><small>Espacio de trabajo</small></span><ChevronDown size={15}/></div>
      <div className="nav-label">ESPACIO DE TRABAJO</div>
      <nav className="nav-list">
        <a href="#overview" className="nav-item active"><LayoutDashboard size={17}/>Inicio</a>
        <a href="#projects" className="nav-item"><FolderKanban size={17}/>Proyectos<span className="nav-count">{projects.length}</span></a>
        <button onClick={() => { setProjectFilter('all'); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }); }} className="nav-item"><ListTodo size={17}/>Tareas</button>
      </nav>
      <div className="project-heading"><span className="nav-label">TUS PROYECTOS</span><button aria-label="Crear proyecto" className="icon-button" onClick={() => setModal('project')}><Plus size={16}/></button></div>
      <div className="project-nav">
        {projects.map((project, index) => <button key={project.id} className={`project-link ${String(project.id) === projectFilter ? 'selected' : ''}`} onClick={() => { setProjectFilter(String(project.id)); setExpandedProjects((current) => [...new Set([...current, String(project.id)])]); }}><span className={`project-dot dot-${index % 4}`}/><span>{project.name}</span><small>{tasks.filter((task) => String(task.project_id) === String(project.id)).length}</small></button>)}
        <button className="add-project" onClick={() => setModal('project')}><Plus size={15}/>Nuevo proyecto</button>
      </div>
      <div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17}/>Configuración</button><button className="nav-item"><CircleHelp size={17}/>Ayuda y soporte</button><div className="profile"><div className="profile-avatar">VM</div><div className="profile-copy"><b>Valeria M.</b><small>Administradora</small></div><MoreHorizontal size={19}/></div></div>
    </aside>

    <main className="main-area" id="top">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> Inicio</div><div className="top-actions"><span className="today">Jueves, 1 de octubre</span><button className="icon-button notification" aria-label="Notificaciones"><Bell size={18}/><i/></button><div className="top-avatar">VM</div></div></header>
      <div className="page-content">
        <section className="home-hero" id="overview"><div className="hero-copy"><span className="hero-tag"><Sparkles size={13}/> TU ESPACIO DE TRABAJO</span><h1>Un buen día para<br/><em>hacer que pase.</em></h1><p>Todo lo importante, organizado en un solo lugar.</p></div><div className="hero-decoration"><div className="hero-ring ring-a"/><div className="hero-ring ring-b"/><div className="hero-star">✳</div><span className="hero-note">un paso<br/>a la vez</span></div><div className="hero-action"><button className="button button-primary" onClick={() => setModal('project')}><Plus size={17}/>Nuevo proyecto</button></div></section>

        {apiError && <div className="api-alert" role="alert"><span>{apiError}</span><button onClick={reloadData}>Reintentar</button></div>}

        <section className="home-stats" aria-label="Resumen"><article><span className="home-stat-icon violet"><FolderKanban size={17}/></span><div><b>{projects.length}</b><small>proyectos</small></div></article><article><span className="home-stat-icon peach"><CircleDot size={17}/></span><div><b>{counts.progress}</b><small>en progreso</small></div></article><article><span className="home-stat-icon green"><Check size={17}/></span><div><b>{counts.done}</b><small>completadas</small></div></article><span className="stat-total">{counts.total} tareas en total</span></section>

        <section className="projects-section" id="projects"><div className="projects-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>TU PANORAMA</div><div className="projects-heading-title"><h2>{projectFilter === 'all' ? 'Tus proyectos' : currentProject}</h2><span className="result-count">{visibleProjects.length}</span></div><p>Abre un proyecto para ver lo que sigue.</p></div><div className="project-tools"><label className="search-box"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tareas..."/></label><label className="select-wrap"><SlidersHorizontal size={15}/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option><option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><ChevronDown size={14}/></label>{projectFilter !== 'all' && <button className="button button-filter" onClick={() => setProjectFilter('all')}><X size={15}/>Ver todos</button>}</div></div>
          {loading ? <div className="projects-empty"><span className="empty-icon"><FolderKanban size={22}/></span><b>Cargando tus proyectos…</b><span>Conectando con tu espacio de trabajo.</span></div> : visibleProjects.length ? <div className="project-cards">{visibleProjects.map((project, index) => { const projectTasks = tasks.filter((task) => String(task.project_id) === String(project.id) && (statusFilter === 'all' || task.status === statusFilter) && task.title.toLowerCase().includes(query.toLowerCase())); const allProjectTasks = tasks.filter((task) => String(task.project_id) === String(project.id)); const complete = allProjectTasks.filter((task) => task.status === 'done').length; const isExpanded = expandedProjects.includes(String(project.id)); return <article className={`project-card ${isExpanded ? 'expanded' : ''}`} key={project.id}><button className="project-card-head" onClick={() => toggleProject(project.id)} aria-expanded={isExpanded}><span className={`project-art art-${index % 4}`}><FolderKanban size={20}/></span><span className="project-main"><span className="project-overline">PROYECTO {String(index + 1).padStart(2, '0')}</span><b>{project.name}</b><small><span className={`project-dot dot-${index % 4}`}/> {allProjectTasks.length} {allProjectTasks.length === 1 ? 'tarea' : 'tareas'} <i/> {complete} completadas</small></span><span className="project-progress"><span className="progress-track"><i style={{ width: `${allProjectTasks.length ? Math.round(complete / allProjectTasks.length * 100) : 0}%` }}/></span><small>{allProjectTasks.length ? Math.round(complete / allProjectTasks.length * 100) : 0}%</small></span><span className={`project-chevron ${isExpanded ? 'open' : ''}`}><ChevronDown size={18}/></span></button>{isExpanded && <div className="project-task-panel"><div className="project-task-heading"><div><b>Tareas del proyecto</b><span>{projectTasks.length} visibles</span></div><button className="button button-small" onClick={() => { setTaskProject(String(project.id)); setTaskStatus('pending'); setModal('task'); }}><Plus size={15}/>Añadir tarea</button></div>{projectTasks.length ? <div className="project-task-list">{projectTasks.map((task) => <div className="project-task-row" key={task.id}><button className={`task-check ${task.status === 'done' ? 'checked' : ''}`} aria-label="Cambiar estado" onClick={() => cycleStatus(task)}>{task.status === 'done' && <Check size={12}/>}</button><span className={`project-task-title ${task.status === 'done' ? 'task-finished' : ''}`}>{task.title}</span><button className={`status-pill ${statusClass[task.status]}`} onClick={() => cycleStatus(task)}><span/>{statusLabel[task.status]}<ChevronDown size={12}/></button><button className="row-menu delete-row" title="Eliminar tarea" aria-label="Eliminar tarea" onClick={() => deleteTask(task)}><X size={15}/></button></div>)}</div> : <div className="project-task-empty"><span>{query || statusFilter !== 'all' ? 'No hay tareas que coincidan con estos filtros.' : 'Este proyecto aún no tiene tareas.'}</span>{!query && statusFilter === 'all' && <button onClick={() => { setTaskProject(String(project.id)); setTaskStatus('pending'); setModal('task'); }}><Plus size={14}/>Crear la primera</button>}</div>}</div>}</article>; })}</div> : <div className="projects-empty"><span className="empty-icon"><FolderKanban size={22}/></span><b>{projects.length ? 'No encontramos ese proyecto' : 'Empieza con tu primer proyecto'}</b><span>{projects.length ? 'Revisa el filtro seleccionado.' : 'Crea un proyecto y empieza a organizar tus tareas.'}</span>{!projects.length && <button className="button button-primary" onClick={() => setModal('project')}><Plus size={16}/>Crear proyecto</button>}</div>}
        </section>
        <footer className="page-footer"><span>© 2026 Workspace</span><span>Hecho para avanzar <span className="footer-heart">✳</span></span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="modal-kicker">WORKSPACE</span><h2 id="modal-title">{modal === 'project' ? 'Nuevo proyecto' : 'Crear tarea'}</h2><p>{modal === 'project' ? 'Crea un espacio para organizar el trabajo.' : 'Agrega una tarea a uno de tus proyectos.'}</p></div><button className="icon-button" onClick={closeModal} aria-label="Cerrar"><X size={19}/></button></div>
      <form onSubmit={modal === 'project' ? addProject : addTask} className="modal-form"><label>{modal === 'project' ? 'Nombre del proyecto' : 'Título de la tarea'}<input autoFocus required value={modal === 'project' ? projectName : taskTitle} onChange={(event) => modal === 'project' ? setProjectName(event.target.value) : setTaskTitle(event.target.value)} placeholder={modal === 'project' ? 'Ej. Lanzamiento de producto' : 'Ej. Preparar propuesta inicial'}/></label>{modal === 'task' && <><label>Proyecto<select required value={taskProject} onChange={(event) => setTaskProject(event.target.value)}><option value="" disabled>Selecciona un proyecto</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label>Estado<select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)}><option value="pending">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select></label></>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={closeModal}>Cancelar</button><button type="submit" className="button button-primary"><Plus size={16}/>{modal === 'project' ? 'Crear proyecto' : 'Crear tarea'}</button></div></form>
    </section></div>}
  </div>;
}

export default App;
