import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';

export default function GeneralTab({
  form,
  updateField,
  existingImages,
  newImageItems,
  addImagesFromFiles,
  removeExistingAt,
  removeNewAt,
}) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">🧾 Información General</h3>

      {/* Images Section */}
      <div className="images-section">
        <h4 className="subsection-title">🖼️ Imágenes del Proyecto</h4>

        <div className="form-field">
          <label htmlFor="project-images">Agregar imágenes</label>
          <input
            id="project-images"
            type="file"
            className="form-input"
            accept="image/*"
            multiple
            onChange={(e) => {
              addImagesFromFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="form-hint">Máx. 5MB por imagen. Puedes eliminar imágenes antes de guardar.</div>
        </div>

        {(existingImages.length > 0 || newImageItems.length > 0) && (
          <div className="images-gallery" aria-label="Carrusel de imágenes">
            <Swiper
              modules={[FreeMode]}
              freeMode
              slidesPerView="auto"
              spaceBetween={12}
              className="images-swiper"
            >
              {existingImages.map((img, idx) => (
                <SwiperSlide key={`existing-${idx}`} className="image-slide">
                  <div className="image-thumb">
                    <img src={img.url} alt={`Imagen existente ${idx + 1}`} loading="lazy" />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => removeExistingAt(idx)}
                      aria-label="Eliminar imagen"
                    >
                      ✕
                    </button>
                  </div>
                </SwiperSlide>
              ))}

              {newImageItems.map((item, idx) => (
                <SwiperSlide key={`new-${idx}`} className="image-slide">
                  <div className="image-thumb new-image">
                    <img src={item.previewUrl} alt={`Nueva imagen ${idx + 1}`} loading="lazy" />
                    <span className="new-badge">Nueva</span>
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => removeNewAt(idx)}
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

      <div className="form-divider"></div>

      <div className="form-field">
        <label>
          Nombre del proyecto <span className="required">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          value={form.general.name}
          onChange={(e) => updateField('general', 'name', e.target.value)}
          placeholder="Ej: Proyecto Solar Valle Verde"
        />
      </div>

      <div className="form-field">
        <label>Descripción corta</label>
        <input
          type="text"
          className="form-input"
          value={form.general.description}
          onChange={(e) => updateField('general', 'description', e.target.value)}
          placeholder="Breve descripción para tarjetas"
        />
      </div>

      <div className="form-field">
        <label>Descripción detallada</label>
        <textarea
          className="form-input"
          rows={4}
          value={form.general.body}
          onChange={(e) => updateField('general', 'body', e.target.value)}
          placeholder="Descripción completa del proyecto (visible en detalle)"
        />
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>Categoría</label>
          <input
            type="text"
            className="form-input"
            value={form.general.category}
            onChange={(e) => updateField('general', 'category', e.target.value)}
            placeholder="Ej: Energía, Minería, Inmobiliario"
          />
        </div>

        <div className="form-field">
          <label>Tipo de proyecto</label>
          <select
            className="form-input"
            value={form.general.type}
            onChange={(e) => updateField('general', 'type', e.target.value)}
          >
            <option value="fixed">🎯 Fijo</option>
            <option value="variable">📊 Variable</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label>Estado del proyecto</label>
        <select
          className="form-input"
          value={form.general.status}
          onChange={(e) => updateField('general', 'status', e.target.value)}
        >
          <option value="draft">📝 Borrador</option>
          <option value="active">🟢 Activo</option>
          <option value="paused">⏸️ Pausado</option>
          <option value="funded">✅ Fondeado</option>
          <option value="closed">🔒 Cerrado</option>
        </select>
      </div>

      <div className="checkbox-group">
        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.general.visibleToUsers}
              onChange={(e) => updateField('general', 'visibleToUsers', e.target.checked)}
            />
            <span className="checkbox-text">Visible para usuarios</span>
          </label>
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.general.investable}
              onChange={(e) => updateField('general', 'investable', e.target.checked)}
            />
            <span className="checkbox-text">Abierto a inversión</span>
          </label>
        </div>      </div>
    </div>
  );
}