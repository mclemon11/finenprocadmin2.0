import React from 'react';
import { formatBytes, toISODateInput } from '../FixedProjectEditModal.utils';

export default function DocumentsTab({
  project,
  existingDocuments,
  newDocumentItems,
  addDocumentsFromFiles,
  removeExistingDocumentAt,
  removeNewDocumentAt,
  updateExistingDocumentMeta,
  updateNewDocumentMeta,
}) {
  const docTypeOptions = [
    { value: '', label: 'Seleccionar...' },
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'estudio_tecnico', label: 'Estudio técnico' },
    { value: 'otro', label: 'Otro' },
  ];

  return (
    <div className="tab-content-section">
      <h3 className="section-title">📄 Documentos</h3>

      <div className="documents-uploader">
        <div className="form-field">
          <label htmlFor="project-documents">Subir documentos</label>
          <input
            id="project-documents"
            type="file"
            className="form-input"
            accept="*/*"
            multiple
            onChange={async (e) => {
              await addDocumentsFromFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="form-hint">Máx. 5MB por archivo. Se aceptan cualquier tipo de archivos.</div>
        </div>
      </div>

      {(existingDocuments.length === 0 && newDocumentItems.length === 0) ? (
        <div className="documents-placeholder">
          <div className="placeholder-icon">📁</div>
          <p>Aún no hay documentos para este proyecto.</p>
        </div>
      ) : (
        <div className="documents-list">
          {existingDocuments.map((docItem, idx) => (
            <div key={docItem.id || `existing-doc-${idx}`} className="document-item">
              <div className="document-main">
                <div className="document-name">
                  <span className="document-badge">Existente</span>
                  <span className="document-filename">{docItem.fileName || 'Documento'}</span>
                </div>
                <div className="document-sub">
                  {docItem.size ? <span>{formatBytes(docItem.size)}</span> : null}
                  {docItem.mimeType ? <span>{docItem.mimeType}</span> : null}
                  {docItem.url ? (
                    <a className="document-link" href={docItem.url} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="document-meta">
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Tipo</label>
                    <select
                      className="form-input"
                      value={docItem.docType || ''}
                      onChange={(e) => updateExistingDocumentMeta(idx, 'docType', e.target.value)}
                    >
                      {docTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fecha</label>
                    <input
                      type="date"
                      className="form-input"
                      value={toISODateInput(docItem.date)}
                      onChange={(e) => updateExistingDocumentMeta(idx, 'date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={docItem.visibleToUsers ?? true}
                      onChange={(e) => updateExistingDocumentMeta(idx, 'visibleToUsers', e.target.checked)}
                    />
                    <span className="checkbox-text">Visible para usuarios</span>
                  </label>
                </div>
              </div>

              <div className="document-actions">
                <button
                  type="button"
                  className="document-remove-btn"
                  onClick={() => removeExistingDocumentAt(idx)}
                >
                  ✕ Eliminar
                </button>
              </div>
            </div>
          ))}

          {newDocumentItems.map((docItem, idx) => (
            <div key={docItem.id || `new-doc-${idx}`} className="document-item new">
              <div className="document-main">
                <div className="document-name">
                  <span className="document-badge new">Nuevo</span>
                  <span className="document-filename">{docItem.fileName || docItem?.file?.name || 'Archivo'}</span>
                </div>
                <div className="document-sub">
                  {docItem.size ? <span>{formatBytes(docItem.size)}</span> : null}
                  {docItem.mimeType ? <span>{docItem.mimeType}</span> : null}
                </div>
              </div>

              <div className="document-meta">
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Tipo</label>
                    <select
                      className="form-input"
                      value={docItem.docType || ''}
                      onChange={(e) => updateNewDocumentMeta(idx, 'docType', e.target.value)}
                    >
                      {docTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fecha</label>
                    <input
                      type="date"
                      className="form-input"
                      value={toISODateInput(docItem.date)}
                      onChange={(e) => updateNewDocumentMeta(idx, 'date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={docItem.visibleToUsers ?? true}
                      onChange={(e) => updateNewDocumentMeta(idx, 'visibleToUsers', e.target.checked)}
                    />
                    <span className="checkbox-text">Visible para usuarios</span>
                  </label>
                </div>
              </div>

              <div className="document-actions">
                <button
                  type="button"
                  className="document-remove-btn"
                  onClick={() => removeNewDocumentAt(idx)}
                >
                  ✕ Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
