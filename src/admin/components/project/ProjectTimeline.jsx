import React, { useState } from 'react';
import useProjectTimeline from '../../hooks/useProjectTimeline';
import './ProjectTimeline.css';

export default function ProjectTimeline({ projectId, adminData }) {
  const { events, loading, addEvent } = useProjectTimeline(projectId);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    type: 'update',
    title: '',
    description: '',
    visibility: 'admin',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;

    try {
      setSaving(true);
      await addEvent({
        ...form,
        createdBy: adminData?.uid || null,
      });
      setForm({ type: 'update', title: '', description: '', visibility: 'admin' });
      setIsAdding(false);
    } catch (err) {
      console.error('Error creando evento:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type) => {
    const icons = {
      milestone: '🎯',
      update: '📢',
      notice: '📋',
      system: '⚙️',
    };
    return icons[type] || '•';
  };

  const getVisibilityBadge = (visibility) => {
    const badges = {
      investors: { label: 'Inversionistas', class: 'badge-investors' },
      all: { label: 'Público', class: 'badge-all' },
      admin: { label: 'Admin', class: 'badge-admin' },
    };
    return badges[visibility] || badges.admin;
  };

  return (
    <div className="project-timeline">
      <div className="timeline-header">
        <h3>Línea de Tiempo</h3>
        {!isAdding && (
          <button className="add-event-btn" onClick={() => setIsAdding(true)}>
            + Agregar evento
          </button>
        )}
      </div>

      {isAdding && (
        <form className="event-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Tipo de evento
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="milestone">Hito (Milestone)</option>
                <option value="update">Actualización</option>
                <option value="notice">Aviso</option>
                <option value="system">Sistema</option>
              </select>
            </label>
            <label>
              Visibilidad
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              >
                <option value="admin">Solo admin</option>
                <option value="investors">Inversionistas</option>
                <option value="all">Todos</option>
              </select>
            </label>
          </div>

          <label>
            Título
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Primer desembolso realizado"
              required
            />
          </label>

          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalla el evento..."
              rows={3}
            />
          </label>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Publicar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="timeline-loading">Cargando eventos...</div>
      ) : events.length === 0 ? (
        <div className="timeline-empty">No hay eventos en la línea de tiempo</div>
      ) : (
        <div className="timeline-list">
          {events.map((event) => {
            const badge = getVisibilityBadge(event.visibility);
            return (
              <div key={event.id} className="timeline-item">
                <div className="timeline-icon">{getEventIcon(event.type)}</div>
                <div className="timeline-content">
                  <div className="timeline-header-row">
                    <h4 className="timeline-title">{event.title}</h4>
                    <span className={`visibility-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  {event.description && (
                    <p className="timeline-description">{event.description}</p>
                  )}
                  <div className="timeline-meta">
                    <span className="timeline-date">{formatDate(event.createdAt)}</span>
                    {event.type && (
                      <span className="timeline-type">{event.type}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
