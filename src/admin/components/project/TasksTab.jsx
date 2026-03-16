import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TasksTab({ tasks, loading, members, onAddTask, onEditTask, onRemoveTask }) {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const assignedMember = members.find((m) => m.userId === form.assignedTo);

    if (editingId) {
      await onEditTask(editingId, {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo || null,
        assignedToName: assignedMember?.displayName || '',
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
    } else {
      await onAddTask({
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo || null,
        assignedToName: assignedMember?.displayName || '',
        priority: form.priority,
        dueDate: form.dueDate || null,
        status: 'pending',
      });
    }
    resetForm();
  };

  const startEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleStatusChange = async (task, newStatus) => {
    await onEditTask(task.id, { status: newStatus });
  };

  const handleDelete = async (task) => {
    if (window.confirm(t('projectDetail.confirmDeleteTask'))) {
      await onRemoveTask(task.id);
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const formatDate = (ts) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString();
  };

  const getPriorityClass = (p) => `priority-${p}`;
  const getStatusClass = (s) => `task-status-${s}`;

  return (
    <div className="tasks-tab">
      <div className="tasks-header">
        <div className="tasks-filters">
          <button className={`task-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            {t('projectDetail.allTasks')} ({tasks.length})
          </button>
          {STATUSES.map((s) => {
            const count = tasks.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                className={`task-filter ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {t(`projectDetail.taskStatus_${s}`)} ({count})
              </button>
            );
          })}
        </div>
        <button className="add-task-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          + {t('projectDetail.addTask')}
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <form className="task-form" onSubmit={handleSubmit}>
          <div className="task-form-grid">
            <div className="form-group full-width">
              <label>{t('projectDetail.taskTitle')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('projectDetail.taskTitlePlaceholder')}
                required
              />
            </div>
            <div className="form-group full-width">
              <label>{t('projectDetail.taskDescription')}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('projectDetail.taskDescPlaceholder')}
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>{t('projectDetail.assignTo')}</label>
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">{t('projectDetail.unassigned')}</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.displayName || m.email}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('projectDetail.taskPriority')}</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{t(`projectDetail.priority_${p}`)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('projectDetail.dueDate')}</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="task-form-actions">
            <button type="button" className="cancel-btn" onClick={resetForm}>{t('common.cancel')}</button>
            <button type="submit" className="confirm-btn">
              {editingId ? t('common.save') : t('projectDetail.addTask')}
            </button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="loading-state">{t('projectDetail.loadingTasks')}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>{t('projectDetail.noTasks')}</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-card-header">
                <div className="task-card-left">
                  <span className={`priority-dot ${getPriorityClass(task.priority)}`} />
                  <h4 className="task-title">{task.title}</h4>
                </div>
                <div className="task-card-right">
                  <select
                    className={`status-select ${getStatusClass(task.status)}`}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`projectDetail.taskStatus_${s}`)}</option>
                    ))}
                  </select>
                  <button className="task-edit-btn" onClick={() => startEdit(task)} title={t('common.edit')}>✏️</button>
                  <button className="task-delete-btn" onClick={() => handleDelete(task)} title={t('common.delete')}>🗑️</button>
                </div>
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-meta">
                {task.assignedToName && (
                  <span className="task-assignee">👤 {task.assignedToName}</span>
                )}
                {task.dueDate && (
                  <span className="task-due">📅 {task.dueDate}</span>
                )}
                <span className="task-created">{formatDate(task.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
