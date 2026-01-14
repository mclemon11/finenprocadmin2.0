import React, { useState } from 'react';
import './ActionModal.css';

export default function ActionModal({
  isOpen,
  title,
  message,
  actionLabel,
  onConfirm,
  onCancel,
  loading,
  showReasonInput,
  reasonPlaceholder
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (showReasonInput && !reason.trim()) {
      alert('Por favor ingresa una razón');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="action-modal-overlay" onClick={onCancel}>
      <div className="action-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="action-modal-title">{title}</h2>
        <p className="action-modal-message">{message}</p>

        {showReasonInput && (
          <textarea
            className="action-modal-textarea"
            placeholder={reasonPlaceholder || 'Ingresa una razón...'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
          />
        )}

        <div className="action-modal-footer">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
