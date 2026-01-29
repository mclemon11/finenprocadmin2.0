import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Swal from 'sweetalert2';
import { useLanguage } from '../../../context/LanguageContext';
import 'swiper/css';
import 'swiper/css/free-mode';
import './FixedProjectEditModal.css';
import './sweetalert2-dark.css';

import { MAX_UPLOAD_BYTES, TABS } from './FixedProjectEditModal.constants';
import { formatBytes, getInitialForm, makeClientId, toISODateInput } from './FixedProjectEditModal.utils';

import GeneralTab from './Tabs/GeneralTab';
import LocationTab from './Tabs/LocationTab';
import FinanceTab from './Tabs/FinanceTab';
import MetricsTab from './Tabs/MetricsTab';
import RisksTab from './Tabs/RisksTab';
import RestrictionsTab from './Tabs/RestrictionsTab';
import ProjectionsTab from './Tabs/ProjectionsTab';
import ChartsTab from './Tabs/ChartsTab';
import DocumentsTab from './Tabs/DocumentsTab';

// Deep compare objects
const deepEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export default function FixedProjectEditModal({ project, isOpen, onClose, onSuccess, onTimelineEvent }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(() => getInitialForm(project));
  const [originalForm, setOriginalForm] = useState(() => getInitialForm(project));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Image states
  const [existingImages, setExistingImages] = useState([]);
  const [newImageItems, setNewImageItems] = useState([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);

  // Documents states
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocumentItems, setNewDocumentItems] = useState([]);
  const [deletedDocumentPaths, setDeletedDocumentPaths] = useState([]);
  const [originalDocuments, setOriginalDocuments] = useState([]);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      const initial = getInitialForm(project);
      setForm(initial);
      setOriginalForm(initial);
      setActiveTab('general');
      setError(null);

      // Initialize images
      const urls = Array.isArray(project.images)
        ? project.images.filter((u) => typeof u === 'string' && u.trim())
        : (project.imageUrl ? [project.imageUrl] : []);

      const paths = Array.isArray(project.imagePaths)
        ? project.imagePaths.filter((p) => typeof p === 'string' && p.trim())
        : (project.imagePath ? [project.imagePath] : []);

      const imageData = urls.map((url, idx) => ({ url, path: paths[idx] || null }));
      setExistingImages(imageData);
      setOriginalImages(imageData);
      setDeletedImagePaths([]);
      setNewImageItems((prev) => {
        for (const item of prev) {
          try {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
        return [];
      });

      // Initialize documents
      const docsSource = Array.isArray(project.documents)
        ? project.documents
        : (Array.isArray(project?.documents?.items) ? project.documents.items : []);

      const docsData = (docsSource || [])
        .filter((d) => d && typeof d === 'object')
        .map((d, idx) => ({
          id: d.id || makeClientId(`doc_${idx}`),
          fileName: d.fileName || d.name || d.filename || 'Documento',
          url: d.url || d.downloadUrl || null,
          path: d.path || d.storagePath || null,
          size: d.size ?? null,
          mimeType: d.mimeType || d.type || null,
          docType: d.docType || d.tipo || '',
          date: toISODateInput(d.date || d.fecha || ''),
          visibleToUsers: d.visibleToUsers ?? d.visible ?? true,
        }));

      setExistingDocuments(docsData);
      setOriginalDocuments(docsData);
      setDeletedDocumentPaths([]);
      setNewDocumentItems([]);
    }
  }, [project]);

  // Check if there are changes (form + images)
  const hasChanges = useMemo(() => {
    const formChanged = !deepEqual(form, originalForm);
    const imagesChanged = newImageItems.length > 0 || deletedImagePaths.length > 0;
    const documentsChanged =
      newDocumentItems.length > 0 ||
      deletedDocumentPaths.length > 0 ||
      !deepEqual(existingDocuments, originalDocuments);
    return formChanged || imagesChanged || documentsChanged;
  }, [
    form,
    originalForm,
    newImageItems,
    deletedImagePaths,
    newDocumentItems,
    deletedDocumentPaths,
    existingDocuments,
    originalDocuments,
  ]);

  // Update nested form value
  const updateField = useCallback((section, field, value) => {
    setForm(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  // Image handlers
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
      setNewImageItems((prev) => [...prev, ...next]);
    }
  };

  const removeExistingAt = (index) => {
    setExistingImages((prev) => {
      const item = prev[index];
      if (item?.path) {
        setDeletedImagePaths((p) => [...p, item.path]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeNewAt = (index) => {
    setNewImageItems((prev) => {
      const item = prev[index];
      try {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Reset all changes to original state
  const resetChanges = useCallback(() => {
    setForm(originalForm);
    setExistingImages([...originalImages]);
    setDeletedImagePaths([]);
    // Clear new images
    for (const item of newImageItems) {
      try {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
    }
    setNewImageItems([]);

    // Reset documents
    setExistingDocuments([...originalDocuments]);
    setDeletedDocumentPaths([]);
    setNewDocumentItems([]);
  }, [originalForm, originalImages, newImageItems, originalDocuments]);

  // Document handlers
  const addDocumentsFromFiles = async (files) => {
    const tooLarge = [];
    const next = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const file of Array.from(files || [])) {
      if (!file) continue;
      if (file.size > MAX_UPLOAD_BYTES) {
        tooLarge.push(file.name);
        continue;
      }

      next.push({
        id: makeClientId('newdoc'),
        file,
        fileName: file.name || 'Archivo',
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        docType: '',
        date: today,
        visibleToUsers: true,
      });
    }

    if (tooLarge.length > 0) {
      await Swal.fire({
        title: t('fixedProjectEdit.fileTooLarge'),
        text: `${t('fixedProjectEdit.fileTooLargeText')} ${tooLarge.slice(0, 3).join(', ')}${tooLarge.length > 3 ? '…' : ''}`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#1a1f2e',
        color: '#ffffff',
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        },
      });
    }

    if (next.length > 0) {
      setNewDocumentItems((prev) => [...prev, ...next]);
    }
  };

  const removeExistingDocumentAt = (index) => {
    setExistingDocuments((prev) => {
      const item = prev[index];
      if (item?.path) {
        setDeletedDocumentPaths((p) => [...p, item.path]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeNewDocumentAt = (index) => {
    setNewDocumentItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExistingDocumentMeta = (index, field, value) => {
    setExistingDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const updateNewDocumentMeta = (index, field, value) => {
    setNewDocumentItems((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  // Handle close with SweetAlert2 - ONLY for Cancel button and X button
  const handleClose = async () => {
    // Don't allow close while saving
    if (saving) return;
    
    if (hasChanges) {
      const result = await Swal.fire({
        title: t('fixedProjectEdit.discardChanges'),
        text: t('fixedProjectEdit.discardChangesText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t('fixedProjectEdit.yesDiscard'),
        cancelButtonText: t('fixedProjectEdit.keepEditing'),
        background: '#1a1f2e',
        color: '#ffffff',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          htmlContainer: 'swal-dark-content',
          container: 'swal-above-modal',
        }
      });

      if (!result.isConfirmed) return;
    }
    
    // Reset changes and close
    resetChanges();
    setError(null);
    onClose();
  };

  // Handle save with SweetAlert2
  const handleSave = async () => {
    if (!project?.id || !hasChanges) return;

    try {
      setSaving(true);
      setError(null);

      // Handle image deletions
      if (deletedImagePaths.length > 0) {
        for (const path of deletedImagePaths) {
          try {
            await deleteObject(ref(storage, path));
          } catch {
            // ignore
          }
        }
      }

      // Upload new images
      const uploaded = [];
      if (newImageItems.length > 0) {
        for (const item of newImageItems) {
          const file = item?.file;
          if (!file) continue;

          const safeName = String(file.name || 'image')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 80);
          const storagePath = `projects/${project.id}/images/${Date.now()}_${safeName}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || 'image/*',
          });
          const url = await getDownloadURL(storageRef);
          uploaded.push({ url, path: storagePath });
        }
      }

      // Handle document deletions
      if (deletedDocumentPaths.length > 0) {
        for (const path of deletedDocumentPaths) {
          try {
            await deleteObject(ref(storage, path));
          } catch {
            // ignore
          }
        }
      }

      // Upload new documents
      const uploadedDocs = [];
      if (newDocumentItems.length > 0) {
        for (const item of newDocumentItems) {
          const file = item?.file;
          if (!file) continue;

          if (file.size > MAX_UPLOAD_BYTES) {
            continue;
          }

          const safeName = String(file.name || 'file')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 120);
          const storagePath = `projects/${project.id}/documents/${Date.now()}_${safeName}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || 'application/octet-stream',
          });

          const url = await getDownloadURL(storageRef);
          uploadedDocs.push({
            id: item.id || makeClientId('doc'),
            fileName: file.name || safeName,
            url,
            path: storagePath,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            docType: item.docType || '',
            date: toISODateInput(item.date) || '',
            visibleToUsers: item.visibleToUsers ?? true,
          });
        }
      }

      const finalImages = [
        ...existingImages.map((x) => x.url).filter(Boolean),
        ...uploaded.map((x) => x.url).filter(Boolean),
      ];
      const finalPaths = [
        ...existingImages.map((x) => x.path).filter(Boolean),
        ...uploaded.map((x) => x.path).filter(Boolean),
      ];

      const finalDocuments = [
        ...existingDocuments,
        ...uploadedDocs,
      ];

      const payload = {
        // General
        name: form.name,
        category: form.category || null,
        status: form.status,
        visibleToUsers: form.visibleToUsers,

        // Images
        images: finalImages,
        imagePaths: finalPaths,
        imageUrl: finalImages[0] || null,
        imagePath: finalPaths[0] || null,
        imageUpdatedAt: serverTimestamp(),

        // Nested objects
        location: form.location,
        finance: form.finance,
        metrics: form.metrics,
        risks: form.risks,
        restrictions: form.restrictions,
        projections: form.projections,
        charts: form.charts,

        // Documents
        documents: finalDocuments,
        documentsUpdatedAt: serverTimestamp(),

        // Legacy compatibility
        targetAmount: form.finance.targetAmount ? Number(form.finance.targetAmount) : null,
        expectedROI: form.metrics.expectedROI ? Number(form.metrics.expectedROI) : null,
        duration: form.metrics.duration ? Number(form.metrics.duration) : null,
        riskLevel: form.risks.riskLevel,
        minInvestment: form.restrictions.minInvestment ? Number(form.restrictions.minInvestment) : null,

        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'projects', project.id), payload);

      // Timeline event
      if (onTimelineEvent) {
        try {
          await onTimelineEvent({
            type: 'system',
            title: t('projectEdit.timeline.projectUpdated'),
            description: t('projectEdit.timeline.fieldsEdited'),
            visibility: 'admin',
          });
        } catch (timelineErr) {
          console.warn('No se pudo registrar evento en timeline:', timelineErr);
        }
      }

      // Update original states
      setOriginalForm(form);
      const newOriginalImages = [
        ...existingImages,
        ...uploaded,
      ];
      setOriginalImages(newOriginalImages);
      setExistingImages(newOriginalImages);
      setNewImageItems([]);
      setDeletedImagePaths([]);

      const newOriginalDocuments = [...finalDocuments];
      setOriginalDocuments(newOriginalDocuments);
      setExistingDocuments(newOriginalDocuments);
      setNewDocumentItems([]);
      setDeletedDocumentPaths([]);

      // Success alert
      await Swal.fire({
        title: t('fixedProjectEdit.alerts.successTitle'),
        text: t('fixedProjectEdit.alerts.successText'),
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: '#1a1f2e',
        color: '#ffffff',
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });

      onSuccess?.();
      onClose(); // Cerrar el modal después de guardar
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      
      await Swal.fire({
        title: t('fixedProjectEdit.alerts.errorTitle'),
        text: err?.code === 'permission-denied' 
          ? t('fixedProjectEdit.alerts.permissionDenied')
          : t('fixedProjectEdit.alerts.updateFailed'),
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#1a1f2e',
        color: '#ffffff',
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralTab 
            form={form} 
            updateField={updateField}
            existingImages={existingImages}
            newImageItems={newImageItems}
            addImagesFromFiles={addImagesFromFiles}
            removeExistingAt={removeExistingAt}
            removeNewAt={removeNewAt}
          />
        );
      case 'location':
        return <LocationTab form={form} updateField={updateField} />;
      case 'finance':
        return <FinanceTab form={form} updateField={updateField} />;
      case 'metrics':
        return <MetricsTab form={form} updateField={updateField} />;
      case 'risks':
        return <RisksTab form={form} updateField={updateField} />;
      case 'restrictions':
        return <RestrictionsTab form={form} updateField={updateField} />;
      case 'projections':
        return <ProjectionsTab form={form} updateField={updateField} />;
      case 'charts':
        return <ChartsTab form={form} setForm={setForm} updateField={updateField} />;
      case 'documents':
        return (
          <DocumentsTab
            project={project}
            existingDocuments={existingDocuments}
            newDocumentItems={newDocumentItems}
            addDocumentsFromFiles={addDocumentsFromFiles}
            removeExistingDocumentAt={removeExistingDocumentAt}
            removeNewDocumentAt={removeNewDocumentAt}
            updateExistingDocumentMeta={updateExistingDocumentMeta}
            updateNewDocumentMeta={updateNewDocumentMeta}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed-edit-overlay">
      <div className="fixed-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with tabs */}
        <div className="fixed-edit-header">
          <div className="fixed-edit-title">
            <h2>✏️ {t('fixedProjectEdit.title')}</h2>
            <span className="project-name-badge">{project.name}</span>
          </div>
          <button className="fixed-edit-close" onClick={handleClose} aria-label={t('common.close')} disabled={saving}>
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="fixed-edit-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`fixed-edit-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{t(`fixedProjectEdit.tabs.${tab.id}`)}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="fixed-edit-content">
          {renderTabContent()}
        </div>

        {/* Error message */}
        {error && (
          <div className="fixed-edit-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Floating action buttons */}
      <div className="fixed-edit-floating-actions">
        <button
          type="button"
          className="floating-btn cancel-btn"
          onClick={handleClose}
          disabled={saving}
        >
          ✕ {t('common.cancel')}
        </button>
        {hasChanges && (
          <button
            type="button"
            className="floating-btn save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                {t('fixedProjectEdit.saving')}
              </>
            ) : (
              <>
                💾 {t('fixedProjectEdit.saveChanges')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
