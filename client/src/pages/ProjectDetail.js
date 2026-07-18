import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../api/axios';
import Modal from '../components/Modal';
import { ToastProvider, useToast } from '../components/Toast';
import './ProjectDetail.css';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#6366f1' },
  { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#22c55e' },
];

function ProjectDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', deadline: '', assignee: '' });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'

  const fetchProject = useCallback(() => {
    api.get(`/projects/${id}`)
      .then(r => setProject(r.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const openCreateTask = (status = 'todo') => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', status, priority: 'medium', deadline: '', assignee: '' });
    setTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      status: task.status, priority: task.priority,
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
      assignee: task.assignee?._id || '',
    });
    setTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setSaving(true);
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, taskForm);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', { ...taskForm, project: id });
        toast.success('Task created');
      }
      setTaskModal(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchProject();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t),
      }));
    } catch {
      toast.error('Failed to update task');
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = (status) => (project.tasks || []).filter(t => t.status === status);

  return (
    <div className="project-detail">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/projects">Projects</Link>
        <span>›</span>
        <span>{project.name}</span>
      </nav>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-title-row">
          <div className="detail-color-dot" style={{ background: project.color }} />
          <h1 className="detail-title">{project.name}</h1>
          <span className={`badge badge-status-${project.status}`}>{project.status}</span>
        </div>
        {project.description && <p className="detail-desc">{project.description}</p>}

        <div className="detail-meta">
          {project.deadline && (
            <span className="meta-item">📅 Deadline: {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
          )}
          <span className="meta-item">👤 {project.owner?.name}</span>
        </div>

        {/* Progress */}
        <div className="detail-progress">
          <div className="detail-progress-bar">
            <div className="detail-progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
          </div>
          <span className="detail-progress-label">{project.progress}% complete</span>
        </div>

        <div className="detail-stats">
          <div className="stat-pill">{project.taskStats?.total || 0} Total</div>
          <div className="stat-pill todo">{project.taskStats?.todo || 0} Todo</div>
          <div className="stat-pill in-progress">{project.taskStats?.inProgress || 0} In Progress</div>
          <div className="stat-pill done">{project.taskStats?.done || 0} Done</div>
        </div>
      </div>

      {/* Controls */}
      <div className="detail-controls">
        <div className="view-toggle">
          <button className={`toggle-view ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>📋 Board</button>
          <button className={`toggle-view ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📄 List</button>
        </div>
        <button className="btn btn-primary" onClick={() => openCreateTask()}>+ Add Task</button>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="kanban-board" role="main">
          {COLUMNS.map(col => (
            <div key={col.key} className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span className="kanban-dot" style={{ background: col.color }} />
                  <span>{col.label}</span>
                  <span className="kanban-count">{tasksByStatus(col.key).length}</span>
                </div>
                <button className="add-task-btn" onClick={() => openCreateTask(col.key)} aria-label={`Add task to ${col.label}`}>+</button>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus(col.key).length === 0 ? (
                  <div className="kanban-empty">No tasks here</div>
                ) : tasksByStatus(col.key).map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={() => openEditTask(task)}
                    onDelete={() => handleDeleteTask(task._id)}
                    onMove={moveTask}
                    columns={COLUMNS}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="task-list-view">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Deadline</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(project.tasks || []).length === 0 ? (
                <tr><td colSpan={6} className="table-empty">No tasks yet</td></tr>
              ) : (project.tasks || []).map(task => (
                <tr key={task._id} className={`task-row priority-row-${task.priority}`}>
                  <td>
                    <div className="task-name-cell">
                      <span className={`priority-dot priority-${task.priority}`} />
                      <span>{task.title}</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                  <td><span className={`priority-badge priority-badge-${task.priority}`}>{task.priority}</span></td>
                  <td>{task.assignee?.name || <span className="unassigned">—</span>}</td>
                  <td>
                    {task.deadline ? (
                      <span className={isPast(new Date(task.deadline)) && task.status !== 'done' ? 'overdue' : ''}>
                        {format(new Date(task.deadline), 'MMM d, yyyy')}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEditTask(task)} aria-label="Edit task">✏️</button>
                      <button className="icon-btn danger" onClick={() => handleDeleteTask(task._id)} aria-label="Delete task">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleTaskSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input id="task-title" type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea id="task-desc" rows={3} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Add more details..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="task-deadline">Deadline</label>
            <input id="task-deadline" type="date" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !taskForm.title.trim()}>
              {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove, columns }) {
  const otherCols = columns.filter(c => c.key !== task.status);

  return (
    <div className={`task-card priority-card-${task.priority}`} role="article" aria-label={`Task: ${task.title}`}>
      <div className="task-card-header">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Edit task">✏️</button>
          <button className="icon-btn danger" onClick={onDelete} aria-label="Delete task">🗑️</button>
        </div>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        <div className="task-card-meta">
          <span className={`priority-badge priority-badge-${task.priority}`}>{task.priority}</span>
          {task.assignee && <span className="task-assignee" title={task.assignee.name}>👤 {task.assignee.name.split(' ')[0]}</span>}
        </div>
        <div className="task-card-right">
          {task.deadline && (
            <span className={`task-deadline-badge ${isPast(new Date(task.deadline)) && task.status !== 'done' ? 'overdue' : ''}`}>
              📅 {format(new Date(task.deadline), 'MMM d')}
            </span>
          )}
          <div className="move-btns">
            {otherCols.map(col => (
              <button key={col.key} className="move-btn" onClick={() => onMove(task._id, col.key)}
                style={{ color: col.color }} title={`Move to ${col.label}`} aria-label={`Move to ${col.label}`}>
                → {col.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  return <ToastProvider><ProjectDetailContent /></ToastProvider>;
}
