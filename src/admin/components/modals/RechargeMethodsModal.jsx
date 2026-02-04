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
import { db, storage } from '../../../firebase/firebaseConfig';
import { useLanguage } from '../../../context/LanguageContext';
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

const emptyForm = {
  name: '',
  detailsText: '',
  status: '',
  type: '',
  imageUrl: '',
  imagePath: '',
};

const uploadRechargeMethodImage = async (file) => {
  if (!file) return null;

  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

  const rawName = file.name || 'image';
  const safeName = rawName.replace(/[^a-zA-Z0-9_.-]+/g, '_');
  const path = `rechargeMethods/${Date.now()}_${safeName}`;

  const storageRef = ref(storage, path);
  const contentType = file.type || undefined;

  const uploadResult = await uploadBytes(
    storageRef,
    file,
    contentType ? { contentType } : undefined
  );

  const url = await getDownloadURL(uploadResult.ref);
  return { imageUrl: url, imagePath: path };
};

export default function RechargeMethodsModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [view, setView] = useState('list'); // 'list' | 'edit' | 'create'
  const [transitionKey, setTransitionKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageDirty, setImageDirty] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setImageFile(file);
    setImageDirty(!!file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview('');
    }
  };
  // Crear nuevo método
  const handleCreate = async () => {
    if (!form.name || !form.type) {
      setError(t('rechargeMethods.requiredFields'));
      return;
    }
    try {
      setSaving(true);
      setError(null);

      let imageData = {};
      if (imageFile) {
        try {
          const uploaded = await uploadRechargeMethodImage(imageFile);
          if (uploaded) imageData = uploaded;
        } catch (e) {
          console.error('Error uploading recharge method image:', e);
          setError(t('rechargeMethods.imageUploadError'));
          setSaving(false);
          return;
        }
      }

      const docRef = await (await import('firebase/firestore')).addDoc(
        collection(db, COLLECTION_NAME),
        {
          name: form.name,
          detailsText: form.detailsText,
          status: form.status || 'active',
          type: form.type,
          ...imageData,
          createdAt: serverTimestamp(),
          updateAt: serverTimestamp(),
        }
      );
      setMethods((prev) => [
        {
          id: docRef.id,
          ...form,
          ...imageData,
          status: form.status || 'active',
          createdAt: new Date(),
          updateAt: new Date(),
        },
        ...prev,
      ]);
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview('');
      setImageDirty(false);
      setView('list');
    } catch (e) {
      setError(t('rechargeMethods.createError'));
    } finally {
      setSaving(false);
    }
  };

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
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setImageDirty(false);
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
        setError(t('rechargeMethods.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, [isOpen, t]);

  const hasChanges = useMemo(() => {
    if (!selected) return imageDirty;
    const baseChanged =
      (selected.name || '') !== (form.name || '') ||
      (selected.detailsText || '') !== (form.detailsText || '') ||
      (selected.status || '') !== (form.status || '') ||
      (selected.type || '') !== (form.type || '');
    return baseChanged || imageDirty;
  }, [selected, form, imageDirty]);

  const openEdit = (method) => {
    setSelected(method);
    setForm({
      name: method?.name || '',
      detailsText: method?.detailsText || '',
      status: normalizeStatus(method?.status),
      type: method?.type || '',
      imageUrl: method?.imageUrl || '',
      imagePath: method?.imagePath || '',
    });
    setImageFile(null);
    setImagePreview('');
    setImageDirty(false);
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
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setImageDirty(false);
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

      let imageData = {};
      if (imageFile) {
        try {
          const uploaded = await uploadRechargeMethodImage(imageFile);
          if (uploaded) imageData = uploaded;
        } catch (e) {
          console.error('Error uploading recharge method image:', e);
          setError(t('rechargeMethods.imageUploadError'));
          setSaving(false);
          return;
        }
      }

      await updateDoc(ref, {
        name: form.name,
        detailsText: form.detailsText,
        status: form.status,
        type: form.type,
        ...imageData,
        updateAt: serverTimestamp(),
      });

      const updated = {
        ...selected,
        name: form.name,
        detailsText: form.detailsText,
        status: form.status,
        type: form.type,
        ...imageData,
      };

      setMethods((prev) => prev.map((m) => (m.id === selected.id ? updated : m)));
      setSelected(updated);
      setImageDirty(false);
    } catch (e) {
      console.error('Error guardando método de recarga:', e);
      setError(t('rechargeMethods.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="recharge-methods-overlay" onClick={onClose}>
      <div className="recharge-methods-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <h2 className="rm-title">{t('rechargeMethods.title')}</h2>
          <button className="rm-close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        {error && <div className="rm-error">{error}</div>}

        <div key={transitionKey} className={`rm-body rm-anim-${view}`}>
          {view === 'list' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                  className="rm-btn rm-btn-primary"
                  onClick={() => {
                    setForm({ ...emptyForm, status: 'active' });
                    setImageFile(null);
                    setImagePreview('');
                    setImageDirty(false);
                    setView('create');
                  }}
                >
                  {t('rechargeMethods.addNew')}
                </button>
              </div>
              {loading ? (
                <div className="rm-loading">{t('rechargeMethods.loading')}</div>
              ) : methods.length === 0 ? (
                <div className="rm-empty">{t('rechargeMethods.noMethods')}</div>
              ) : (
                <div className="rm-list">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      className="rm-list-item"
                      onClick={() => openEdit(m)}
                      title={t('rechargeMethods.editMethod')}
                    >
                      <div className="rm-list-main">
                        <div className="rm-list-name">{m.name || t('rechargeMethods.noName')}</div>
                        <div className="rm-list-meta">
                          <span className="rm-pill">{m.type || t('rechargeMethods.noType')}</span>
                          <span className="rm-pill">{m.status || t('rechargeMethods.noStatus')}</span>
                        </div>
                      </div>
                      <div className="rm-list-date">{formatDateTime(m.createdAt)}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : view === 'create' ? (
            <>
              <div className="rm-form">
                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.name')}</span>
                  <input
                    className="rm-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    disabled={saving}
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.type')}</span>
                  <select
                    className="rm-input"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="crypto">{t('rechargeMethods.typeCrypto')}</option>
                    <option value="bank">{t('rechargeMethods.typeBank')}</option>
                  </select>
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.status')}</span>
                  <select
                    className="rm-input"
                    value={normalizeStatus(form.status)}
                    onChange={(e) => setForm((f) => ({ ...f, status: normalizeStatus(e.target.value) }))}
                    disabled={saving}
                  >
                    <option value="active">{t('rechargeMethods.statusActive')}</option>
                    <option value="inactive">{t('rechargeMethods.statusInactive')}</option>
                  </select>
                </label>

                <label className="rm-field rm-field-full">
                  <span className="rm-label">{t('rechargeMethods.image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="rm-input"
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                  {(imagePreview || form.imageUrl) && (
                    <div className="rm-image-preview-wrapper">
                      <img
                        src={imagePreview || form.imageUrl}
                        alt={form.name || 'preview'}
                        className="rm-image-preview"
                      />
                    </div>
                  )}
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.details')}</span>
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
              </div>

              <div className="rm-footer">
                <button
                  className="rm-btn rm-btn-secondary"
                  onClick={() => {
                    setView('list');
                    setForm(emptyForm);
                    setImageFile(null);
                    setImagePreview('');
                    setImageDirty(false);
                  }}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="rm-btn rm-btn-primary"
                  onClick={handleCreate}
                  disabled={saving || !form.name || !form.type}
                >
                  {saving ? t('rechargeMethods.saving') : t('rechargeMethods.create') || 'Crear'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rm-form">
                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.name')}</span>
                  <input
                    className="rm-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    disabled={saving}
                  />
                </label>

                <label className="rm-field rm-field-full">
                  <span className="rm-label">{t('rechargeMethods.image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="rm-input"
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                  {(imagePreview || form.imageUrl) && (
                    <div className="rm-image-preview-wrapper">
                      <img
                        src={imagePreview || form.imageUrl}
                        alt={form.name || 'preview'}
                        className="rm-image-preview"
                      />
                    </div>
                  )}
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.type')}</span>
                  <select
                    className="rm-input"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="crypto">{t('rechargeMethods.typeCrypto')}</option>
                    <option value="bank">{t('rechargeMethods.typeBank')}</option>
                  </select>
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.status')}</span>
                  <select
                    className="rm-input"
                    value={normalizeStatus(form.status)}
                    onChange={(e) => setForm((f) => ({ ...f, status: normalizeStatus(e.target.value) }))}
                    disabled={saving}
                  >
                    <option value="active">{t('rechargeMethods.statusActive')}</option>
                    <option value="inactive">{t('rechargeMethods.statusInactive')}</option>
                  </select>
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.details')}</span>
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
                  <span className="rm-label">{t('rechargeMethods.created')}</span>
                  <input
                    className="rm-input rm-input-readonly"
                    value={formatDateTime(selected?.createdAt)}
                    readOnly
                  />
                </label>

                <label className="rm-field">
                  <span className="rm-label">{t('rechargeMethods.updated')}</span>
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
                  {t('common.cancel')}
                </button>
                <button
                  className="rm-btn rm-btn-primary"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? t('rechargeMethods.saving') : t('rechargeMethods.saveChanges')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
