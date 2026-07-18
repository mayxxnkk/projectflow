import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { format, isPast, isToday } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/tasks')])
      .then(([p, t]) => { setProjects(p.data); setTasks(t.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const overdueTasks = tasks.filter(t => t.deadline && isPast(new Date(t.deadline)) && t.status !== 'done').length;
  const dueTodayTasks = tasks.filter(t => t.deadline && isToday(new Date(t.deadline)) && t.status !== 'done').length;

  const doughnutData = {
    labels: ['Done', 'In Progress', 'Todo'],
    datasets: [{
      data: [doneTasks, inProgressTasks, todoTasks],
      backgroundColor: ['#22c55e', '#f59e0b', '#6366f1'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const barData = {
    labels: projects.slice(0, 6).map(p => p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name),
    datasets: [{
      label: 'Progress %',
      data: projects.slice(0, 6).map(p => p.progress || 0),
      backgroundColor: projects.slice(0, 6).map(p => p.color || '#6366f1'),
      borderRadius: 6,
    }],
  };

  const recentTasks = [...tasks]
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="📁" label="Total Projects" value={projects.length} color="#6366f1" />
        <StatCard icon="✅" label="Tasks Done" value={doneTasks} total={totalTasks} color="#22c55e" />
        <StatCard icon="⚡" label="In Progress" value={inProgressTasks} color="#f59e0b" />
        <StatCard icon="🔴" label="Overdue" value={overdueTasks} color="#ef4444" />
        {dueTodayTasks > 0 && <StatCard icon="📅" label="Due Today" value={dueTodayTasks} color="#3b82f6" />}
      </div>

      <div className="dashboard-grid">
        {/* Charts */}
        <div className="card chart-card">
          <h3 className="card-title">Task Overview</h3>
          {totalTasks > 0 ? (
            <div className="doughnut-wrapper">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
            </div>
          ) : (
            <div className="empty-chart">No tasks yet</div>
          )}
        </div>

        {projects.length > 0 && (
          <div className="card chart-card">
            <h3 className="card-title">Project Progress</h3>
            <Bar data={barData} options={{
              plugins: { legend: { display: false } },
              scales: { y: { max: 100, ticks: { callback: v => v + '%' } }, x: { grid: { display: false } } },
              indexAxis: 'x',
            }} />
          </div>
        )}

        {/* Upcoming tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Tasks</h3>
            <Link to="/projects" className="card-link">View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="empty-text">No pending tasks — great work!</p>
          ) : (
            <ul className="task-list">
              {recentTasks.map(task => (
                <li key={task._id} className="task-item">
                  <div className="task-meta">
                    <span className={`priority-dot priority-${task.priority}`} />
                    <div>
                      <div className="task-title">{task.title}</div>
                      <div className="task-project">{task.project?.name}</div>
                    </div>
                  </div>
                  <div className="task-right">
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                    {task.deadline && (
                      <span className={`deadline ${isPast(new Date(task.deadline)) ? 'overdue' : ''}`}>
                        {isToday(new Date(task.deadline)) ? 'Today' : format(new Date(task.deadline), 'MMM d')}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Projects</h3>
            <Link to="/projects" className="card-link">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <p className="empty-text">No projects yet. <Link to="/projects">Create one</Link>.</p>
          ) : (
            <ul className="project-list">
              {projects.slice(0, 4).map(p => (
                <li key={p._id}>
                  <Link to={`/projects/${p._id}`} className="project-item">
                    <div className="project-color-dot" style={{ background: p.color }} />
                    <div className="project-info">
                      <div className="project-name">{p.name}</div>
                      <div className="progress-bar-wrapper">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                        </div>
                        <span className="progress-label">{p.progress}%</span>
                      </div>
                    </div>
                    <span className={`badge badge-status-${p.status}`}>{p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, total, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>{value}{total !== undefined && <span className="stat-total">/{total}</span>}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
