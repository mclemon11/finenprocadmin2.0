import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import './RechargeMethodsModal.css';

const COLLECTION_NAME = 'rechargeMethods';

const normalizeStatus = (value) => {
  const s = String(value || '').toLowerCase().trim();
  if (s === 'active' || s === 'inactive') return s;
  return 'inactive';
};

const safeToDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDateTime = (value) => {
  const d = safeToDate(value);
  if (!d) return '-';
  return d.toLocaleString('es-MX');
};

export default function RechargeMethodsModal({ isOpen, onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [transitionKey, setTransitionKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '',
    detailsText: '',
    status: '',
    type: '',
  });

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const resetState = () => {
    setView('list');
    setTransitionKey((k) => k + 1);
    setLoading(false);
    setSaving(false);
    setError(null);
    setMethods([]);
    setSelected(null);
    setForm({ name: '', detailsText: '', status: '', type: '' });
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = query(
          collection(db, COLLECTION_NAME),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMethods(data);
      } catch (e) {
        console.error('Error cargando métodos de recarga:', e);
        setError('No se pudieron cargar los métodos de recarga');
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, [isOpen]);

  const hasChanges = useMemo(() => {
    if (!selected) return false;
    return (
      (selected.name || '') !== (form.name || '') ||
      (selected.detailsText || '') !== (form.detailsText || '') ||
      (selected.status || '') !== (form.status || '') ||
      (selected.type || '') !== (form.type || '')
    );
  }, [selected, form]);

  const openEdit = (method) => {
    setSelected(method);
    setForm({
      name: method?.name || '',
      detailsText: method?.detailsText || '',
      status: normalizeStatus(method?.status),
      type: method?.type || '',
    });
    setView('edit');
    setTransitionKey((k) => k + 1);

    // Ensure textarea is resized after the view switch.
    requestAnimationFrame(() => {
      const el = document.querySelector('.rm-textarea');
      autoResizeTextarea(el);
    });
  };

  const backToList = () => {
    setSelected(null);
    setForm({ name: '', detailsText: '', status: '', type: '' });
    setView('list');
    setTransitionKey((k) => k + 1);
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!hasChanges) return;

    try {
      setSaving(true);
      setError(null);

      const ref = doc(db, COLLECTION_NAME, selected.id);
      await updateDoc(ref, {
        name: form.name,
        detailsText: form.detailsText,
        status: form.status,
        type: form.type,
        updateAt: serverTimestamp(),
      });

      const updated = {
        ...selected,
        name: form.name,
        detailsText: form.detailsText,
        status: form.status,
        type: form.type,
      };

      setMethods((prev) => prev.map((m) => (m.id === selected.id ? updated : m)));
      setSelected(updated);
    } catch (e) {
      console.error('Error guardando método de recarga:', e);
      setError('No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="recharge-methods-overlay" onClick={onClose}>
      <div className="recharge-methods-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <h2 className="rm-title">Métodos de Recargas</h2>
          <button className="rm-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {error && <div className="rm-error">{error}</div>}

        <div key={transitionKey} className={`rm-body rm-anim-${view}`}>
          {view === 'list' ? (
            <>
              {loading ? (
                <div className="rm-loading">Cargando métodos...</div>
              ) : methods.length === 0 ? (
                <div className="rm-empty">No hay métodos de recarga</div>
              ) : (
                <div className="rm-list">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      className="rm-list-item"
                      onClick={() => openEdit(m)}
                      title="Editar método"
                    >
                      <div className="rm-list-main">
                        <div className="rm-list-name">{m.name || 'Sin nombre'}</div>
                        <div className="rm-list-meta">
                          <span className="rm-pill">{m.type || 'Sin tipo'}</span>
                          <span className="rm-pill">{m.status || 'Sin estado'}</span>
                        </div>
                      </div>
                      <div className="rm-list-date">{formatDateTime(m.createdAt)}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rm-form">
                <label className="rm-field">
                  <span className="rm-label">Nombre</span>
                  <input
                    className="rm-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    disabled={saving}
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">Tipo</span>
                  <input
                    className="rm-input"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    disabled={saving}
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">Estado</span>
                  <select
                    className="rm-input"
                    value={normalizeStatus(form.status)}
                    onChange={(e) => setForm((f) => ({ ...f, status: normalizeStatus(e.target.value) }))}
                    disabled={saving}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>

                <label className="rm-field">
                  <span className="rm-label">Detalles</span>
                  <textarea
                    className="rm-textarea"
                    value={form.detailsText}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, detailsText: e.target.value }));
                      autoResizeTextarea(e.target);
                    }}
                    disabled={saving}
                    rows={4}
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">Creado</span>
                  <input
                    className="rm-input rm-input-readonly"
                    value={formatDateTime(selected?.createdAt)}
                    readOnly
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">Actualizado</span>
                  <input
                    className="rm-input rm-input-readonly"
                    value={formatDateTime(selected?.updateAt)}
                    readOnly
                  />
                </label>
              </div>

              <div className="rm-footer">
                <button
                  className="rm-btn rm-btn-secondary"
                  onClick={backToList}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="rm-btn rm-btn-primary"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
