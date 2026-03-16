import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getAllAdvisors, createAdvisor, updateAdvisor, deleteAdvisor } from '../services/advisor.service';
import AdvisorModal from '../components/modals/AdvisorModal';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdEmail, MdPhone } from 'react-icons/md';
import Swal from 'sweetalert2';
import './AdvisorsPage.css';

export default function AdvisorsPage() {
  const { t } = useLanguage();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAdvisors = async () => {
    setLoading(true);
    const res = await getAllAdvisors();
    if (res.success) {
      setAdvisors(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const handleCreate = () => {
    setEditingAdvisor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (advisor) => {
    setEditingAdvisor(advisor);
    setIsModalOpen(true);
  };

  const handleDelete = async (advisor) => {
    const result = await Swal.fire({
      title: t('advisorManager.confirmDelete'),
      text: `${advisor.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('advisorManager.yesDelete'),
      cancelButtonText: t('common.cancel'),
      customClass: { popup: 'swal-dark-popup' },
    });

    if (result.isConfirmed) {
      const res = await deleteAdvisor(advisor.id, advisor.photoUrl);
      if (res.success) {
        setAdvisors((prev) => prev.filter((a) => a.id !== advisor.id));
        Swal.fire({
          icon: 'success',
          title: t('advisorManager.deleted'),
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'swal-dark-popup' },
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: t('advisorManager.errorTitle'),
          text: res.error,
          customClass: { popup: 'swal-dark-popup' },
        });
      }
    }
  };

  const handleSave = async (formData, photoFile) => {
    setSaving(true);
    let res;
    if (editingAdvisor) {
      res = await updateAdvisor(editingAdvisor.id, formData, photoFile);
    } else {
      res = await createAdvisor(formData, photoFile);
    }
    setSaving(false);

    if (res.success) {
      setIsModalOpen(false);
      setEditingAdvisor(null);
      fetchAdvisors();
      Swal.fire({
        icon: 'success',
        title: editingAdvisor ? t('advisorManager.updated') : t('advisorManager.created'),
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'swal-dark-popup' },
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: t('advisorManager.errorTitle'),
        text: res.error,
        customClass: { popup: 'swal-dark-popup' },
      });
    }
  };

  return (
    <div className="advisors-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('advisorManager.title')}</h1>
          <p className="page-subtitle">{t('advisorManager.subtitle')}</p>
        </div>
        <button className="advisors-create-btn" onClick={handleCreate}>
          <MdAdd /> {t('advisorManager.createAdvisor')}
        </button>
      </div>

      {loading ? (
        <div className="advisors-loading">{t('common.loading')}...</div>
      ) : advisors.length === 0 ? (
        <div className="advisors-empty">
          <MdPerson className="advisors-empty-icon" />
          <p>{t('advisorManager.noAdvisors')}</p>
          <button className="advisors-create-btn" onClick={handleCreate}>
            <MdAdd /> {t('advisorManager.createFirst')}
          </button>
        </div>
      ) : (
        <div className="advisors-grid">
          {advisors.map((advisor) => (
            <div key={advisor.id} className="advisor-card-item">
              <div className="advisor-card-top">
                {advisor.photoUrl ? (
                  <img src={advisor.photoUrl} alt={advisor.name} className="advisor-card-avatar" />
                ) : (
                  <div className="advisor-card-avatar-placeholder"><MdPerson /></div>
                )}
                <div className="advisor-card-info">
                  <h3 className="advisor-card-name">{advisor.name}</h3>
                  {advisor.specialty && (
                    <span className="advisor-card-specialty">{advisor.specialty}</span>
                  )}
                </div>
                <div className="advisor-card-actions">
                  <button className="advisor-action-btn edit" onClick={() => handleEdit(advisor)} title={t('advisorManager.edit')}>
                    <MdEdit />
                  </button>
                  <button className="advisor-action-btn delete" onClick={() => handleDelete(advisor)} title={t('advisorManager.delete')}>
                    <MdDelete />
                  </button>
                </div>
              </div>
              <div className="advisor-card-details">
                {advisor.email && (
                  <div className="advisor-detail-row">
                    <MdEmail className="advisor-detail-icon" />
                    <span>{advisor.email}</span>
                  </div>
                )}
                {advisor.phone && (
                  <div className="advisor-detail-row">
                    <MdPhone className="advisor-detail-icon" />
                    <span>{advisor.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdvisorModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAdvisor(null); }}
        onSave={handleSave}
        advisor={editingAdvisor}
        saving={saving}
      />
    </div>
  );
}
