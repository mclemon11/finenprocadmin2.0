import React, { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import './ProjectFormModal.css';

export default function ProjectFormModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    body: '',
    type: 'fixed',
    category: '',
    riskLevel: 'medium',
    expectedROI: '',
    durationMonths: '',
    targetAmount: '',
    minInvestment: '',
    maxInvestment: '',
    drawdown: '',
    performance: '',
    manualControl: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageItems, setImageItems] = useState([]);

  const sampleCategories = ['Energía', 'Trading', 'Crypto', 'Inmobiliario'];

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      body: '',
      type: 'fixed',
      category: '',
      riskLevel: 'medium',
      expectedROI: '',
      durationMonths: '',
      targetAmount: '',
      minInvestment: '',
      maxInvestment: '',
      drawdown: '',
      performance: '',
      manualControl: true,
    });
    setError(null);
    setImageItems((prev) => {
      for (const item of prev) {
        try {
          if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      }
      return [];
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      setImageItems((prev) => {
        for (const item of prev) {
          try {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
        return prev;
      });
    };
  }, [isOpen]);

  const addImagesFromFiles = (files) => {
    const maxBytes = 5 * 1024 * 1024;
    const next = [];

    for (const file of Array.from(files || [])) {
      if (!String(file?.type || '').startsWith('image/')) continue;
      if (file.size > maxBytes) continue;
      const previewUrl = URL.createObjectURL(file);
      next.push({ file, previewUrl });
    }

    if (next.length > 0) {
      setImageItems((prev) => [...prev, ...next]);
    }
  };

  const removeImageAt = (index) => {
    setImageItems((prev) => {
      const item = prev[index];
      try {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e, statusToSet = 'draft') => {
    e.preventDefault();
    if (!form.name) {
      setError('El nombre es obligatorio');
      return;
    }

    const isFixed = form.type === 'fixed';
    const targetAmountNum = isFixed ? Number(form.targetAmount) : null;
    const minInvestmentNum = isFixed && form.minInvestment !== '' ? Number(form.minInvestment) : null;
    const maxInvestmentNum = isFixed && form.maxInvestment !== '' ? Number(form.maxInvestment) : null;

    if (isFixed) {
      if (!Number.isFinite(targetAmountNum) || targetAmountNum <= 0) {
        setError('El capital objetivo (targetAmount) es obligatorio y debe ser mayor a 0');
        return;
      }

      if (minInvestmentNum !== null) {
        if (!Number.isFinite(minInvestmentNum) || minInvestmentNum <= 0) {
          setError('La inversión mínima debe ser un número mayor a 0');
          return;
        }
        if (minInvestmentNum > targetAmountNum) {
          setError('La inversión mínima no puede ser mayor al capital objetivo');
          return;
        }
      }

      if (maxInvestmentNum !== null) {
        if (!Number.isFinite(maxInvestmentNum) || maxInvestmentNum <= 0) {
          setError('La inversión máxima debe ser un número mayor a 0');
          return;
        }
        if (maxInvestmentNum > targetAmountNum) {
          setError('La inversión máxima no puede ser mayor al capital objetivo');
          return;
        }
      }

      if (minInvestmentNum !== null && maxInvestmentNum !== null && minInvestmentNum > maxInvestmentNum) {
        setError('La inversión mínima no puede ser mayor que la inversión máxima');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        // Subtitle (short description shown on cards)
        description: form.description?.trim() ? form.description.trim() : null,
        // Long description (shown only on project detail)
        body: form.body?.trim() ? form.body.trim() : null,
        type: form.type,
        category: form.category || null,
        riskLevel: form.riskLevel || 'medium',
        expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
        duration: form.durationMonths ? Number(form.durationMonths) : null,
        status: 'draft',
        targetAmount: isFixed ? targetAmountNum : null,
        // Support both field names used in different parts of the app.
        totalInvested: 0,
        totalInvestment: 0,
        minInvestment: isFixed ? minInvestmentNum : null,
        maxInvestment: isFixed ? maxInvestmentNum : null,
        autoLockOnTarget: isFixed ? true : null,
        drawdown: !isFixed && form.drawdown ? Number(form.drawdown) : null,
        performance: !isFixed && form.performance ? Number(form.performance) : null,
        manualControl: form.manualControl,
        investable: statusToSet === 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), payload);

      if (imageItems.length > 0) {
        const uploads = [];
        for (const item of imageItems) {
          const file = item?.file;
          if (!file) continue;

          const safeName = String(file.name || 'image')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 80);
          const storagePath = `projects/${docRef.id}/images/${Date.now()}_${safeName}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || 'image/*',
          });
          const url = await getDownloadURL(storageRef);
          uploads.push({ url, path: storagePath });
        }

        const urls = uploads.map((u) => u.url).filter(Boolean);
        const paths = uploads.map((u) => u.path).filter(Boolean);

        await updateDoc(docRef, {
          images: urls,
          imagePaths: paths,
          imageUrl: urls[0] || null,
          imagePath: paths[0] || null,
          imageUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creando proyecto', err);
      setError('No se pudo crear el proyecto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={handleClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Proyecto Financiero</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'draft')}>
          <div className="modal-body">
            <div className="form-section-header">
              <h3>Información General</h3>
              <p>Datos básicos del proyecto financiero</p>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <h3>🖼️ Imágenes</h3>
                <p>Puedes agregar varias imágenes (y eliminarlas antes de guardar)</p>
              </div>

              <div className="form-row">
                <label>
                  Agregar imágenes
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addImagesFromFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <span className="field-hint">Formato recomendado 16:9. Máx. 5MB por imagen.</span>
                </label>
              </div>

              {imageItems.length > 0 && (
                <div className="project-images-carousel" aria-label="Previsualización de imágenes">
                  <Swiper
                    modules={[FreeMode]}
                    freeMode
                    slidesPerView="auto"
                    spaceBetween={12}
                    className="project-images-swiper"
                  >
                    {imageItems.map((item, idx) => (
                      <SwiperSlide key={`new-img-${idx}`} className="project-images-slide">
                        <div className="project-images-thumb">
                          <img src={item.previewUrl} alt={`Imagen ${idx + 1}`} loading="lazy" />
                          <button
                            type="button"
                            className="project-images-remove"
                            onClick={() => removeImageAt(idx)}
                            aria-label="Eliminar imagen"
                          >
                            ✕
                          </button>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>

            <div className="form-row">
              <label>
                Nombre del proyecto *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Fondo Deuda USD 12%"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Subtítulo (descripción breve)
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Inversión a 12 meses con retorno estimado"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Descripción extensa (se muestra solo en detalles)
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Describe el proyecto con más detalle..."
                  rows={5}
                />
              </label>
            </div>

            <div className="form-row form-row-2">
              <label>
                Tipo de proyecto *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="fixed">Fijo (meta de capital)</option>
                  <option value="variable">Variable (trading/crypto)</option>
                </select>
              </label>
              <label>
                <span className="label-with-badge">
                  Categoría
                  <span className="label-badge">Catálogo admin</span>
                </span>
                <div className="category-select" onClick={() => setIsCategoryOpen((prev) => !prev)}>
                  <div className="category-control" role="button" tabIndex={0}>
                    <div className="category-value">{form.category || 'Busca o selecciona una categoría creada por admin'}</div>
                    <div className="category-caret">▾</div>
                  </div>
                  {isCategoryOpen && (
                    <div className="category-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="Buscar categorías"
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        />
                      </div>
                      <div className="dropdown-section">
                        {sampleCategories.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            className={`dropdown-item ${form.category === cat ? 'selected' : ''}`}
                            onClick={() => {
                              setForm({ ...form, category: cat });
                              setShowCreateInline(false);
                              setIsCategoryOpen(false);
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="dropdown-section create-section">
                        <button
                          type="button"
                          className="dropdown-item create-item"
                          onClick={() => {
                            setShowCreateInline(true);
                          }}
                        >
                          ➕ Crear nueva categoría
                        </button>

                        {showCreateInline && (
                          <div className="inline-create">
                            <label>
                              Nombre de la categoría
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Ej. Deuda privada USD"
                              />
                            </label>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="draft-btn ghost"
                                onClick={() => {
                                  setShowCreateInline(false);
                                  setNewCategoryName('');
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="submit-btn compact"
                                onClick={() => {
                                  if (!newCategoryName.trim()) return;
                                  setForm({ ...form, category: newCategoryName.trim() });
                                  setShowCreateInline(false);
                                  setIsCategoryOpen(false);
                                  setNewCategoryName('');
                                }}
                              >
                                Crear y seleccionar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <span className="field-hint">Las categorías son creadas por administradores y se reutilizan en proyectos futuros.</span>
              </label>
            </div>

            <div className="form-row form-row-3">
              <label>
                Nivel de riesgo *
                <select
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </label>
              <label>
                ROI esperado (%)
                <input
                  type="number"
                  step="0.01"
                  value={form.expectedROI}
                  onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
                  placeholder="12"
                />
              </label>
              <label>
                Duración (meses)
                <input
                  type="number"
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                  placeholder="12"
                />
              </label>
            </div>

            {form.type === 'fixed' && (
              <div className="form-section form-section-financial">
                <div className="form-section-header">
                  <h3>⚙️ Configuración Financiera (Proyecto Fijo)</h3>
                  <p>Establece los límites de capital e inversión</p>
                </div>
                <div className="form-row form-row-3">
                  <label>
                    Capital objetivo (USD)
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                      placeholder="500000"
                    />
                  </label>
                  <label>
                    Inversión mínima (USD)
                    <input
                      type="number"
                      value={form.minInvestment}
                      onChange={(e) => setForm({ ...form, minInvestment: e.target.value })}
                      placeholder="1000"
                    />
                  </label>
                  <label>
                    Inversión máxima (USD)
                    <input
                      type="number"
                      value={form.maxInvestment}
                      onChange={(e) => setForm({ ...form, maxInvestment: e.target.value })}
                      placeholder="50000"
                    />
                  </label>
                </div>
              </div>
            )}

            {form.type === 'variable' && (
              <div className="form-section form-section-financial">
                <div className="form-section-header">
                  <h3>📊 Configuración Financiera (Proyecto Variable)</h3>
                  <p>Métricas de rendimiento y control</p>
                </div>
                <div className="form-row form-row-2">
                  <label>
                    Drawdown (%)
                    <input
                      type="number"
                      step="0.01"
                      value={form.drawdown}
                      onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                      placeholder="-5"
                    />
                  </label>
                  <label>
                    Performance (%)
                    <input
                      type="number"
                      step="0.01"
                      value={form.performance}
                      onChange={(e) => setForm({ ...form, performance: e.target.value })}
                      placeholder="8"
                    />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.manualControl}
                    onChange={(e) => setForm({ ...form, manualControl: e.target.checked })}
                  />
                  Control manual del estado (permite pausar/reanudar)
                </label>
              </div>
            )}

            <div className="form-section form-section-advanced">
              <div className="form-section-header">
                <h3>🛰️ Configuración avanzada</h3>
                <p>Próximamente campos técnicos para proyectos mixtos o de trading/crypto</p>
              </div>
              <div className="placeholder-box">
                <p>Esta área reservará parámetros como ejecución, exchanges, riesgo dinámico y conectores técnicos.</p>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="draft-btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear borrador'}
            </button>
            <button 
              type="button" 
              className="submit-btn" 
              onClick={(e) => handleSubmit(e, 'active')}
              disabled={saving}
            >
              {saving ? 'Publicando...' : 'Crear y publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
