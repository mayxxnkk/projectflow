import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';
import Modal from '../components/Modal';
import { ToastProvider, useToast } from '../components/Toast';
import './Projects.css';

const PROJECT_COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#8b5cf6','#14b8a6'];

function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', deadline: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', color: '#6366f1', deadline: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (p, e) => {
    e.preventDefault();
    setEditProject(p);
    setForm({
      name: p.name, description: p.description || '', color: p.color,
      deadline: p.deadline ? p.deadline.slice(0, 10) : '', status: p.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editProject) {
        await api.put(`/projects/${editProject._id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects', form);
        toast.success('Project created');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    setDeleting(id);
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
      </div>

      <div className="search-bar">
        <input
          type="search" placeholder="Search projects..."
          value={search} onChange={e => setSearch(e.target.value)}
          aria-label="Search projects"
        />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>{search ? 'No projects found' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Create your first project to get started.'}</p>
          {!search && <button className="btn btn-primary" onClick={openCreate}>Create Project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} className="project-card">
              <div className="project-card-top" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}44)` }}>
                <div className="project-card-color" style={{ background: p.color }} />
                <div className="project-card-actions">
                  <button className="icon-btn" onClick={(e) => openEdit(p, e)} title="Edit project" aria-label="Edit project">✏️</button>
                  <button className="icon-btn danger" onClick={(e) => { e.preventDefault(); handleDelete(p._id); }} disabled={deleting === p._id} title="Delete project" aria-label="Delete project">🗑️</button>
                </div>
              </div>
              <div className="project-card-body">
                <div className="project-card-header">
                  <h3 className="project-card-name">{p.name}</h3>
                  <span className={`badge badge-status-${p.status}`}>{p.status}</span>
                </div>
                {p.description && <p className="project-card-desc">{p.description}</p>}

                <div className="project-progress-section">
                  <div className="progress-bar-row">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                    </div>
                    <span className="progress-pct">{p.progress}%</span>
                  </div>
                  <div className="project-stats">
                    <span>{p.taskStats?.total || 0} tasks</span>
                    <span>{p.taskStats?.done || 0} done</span>
                  </div>
                </div>

                {p.deadline && (
                  <div className="project-deadline">
                    📅 {format(new Date(p.deadline), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="proj-name">Project Name *</label>
            <input id="proj-name" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label htmlFor="proj-desc">Description</label>
            <textarea id="proj-desc" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What is this project about?" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proj-deadline">Deadline</label>
              <input id="proj-deadline" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
            {editProject && (
              <div className="form-group">
                <label htmlFor="proj-status">Status</label>
                <select id="proj-status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {PROJECT_COLORS.map(c => (
                <button type="button" key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setForm({...form, color: c})}
                  aria-label={`Select color ${c}`} aria-pressed={form.color === c} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function Projects() {
  return <ToastProvider><ProjectsContent /></ToastProvider>;
}
