import React, { useEffect, useState, useMemo } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Swal from 'sweetalert2';
import { useLanguage } from '../../../context/LanguageContext';
import { getAllContacts, createContact, notifyContactAddedToProject } from '../../services/contacts.service';
import { getAllAdvisors } from '../../services/advisor.service';
import useAdminUsers from '../../hooks/useAdminUsers';
import 'swiper/css';
import 'swiper/css/free-mode';
import './ProjectFormModal.css';

export default function ProjectFormModal({ isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();
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
    expectedReturn: '',
    returnPeriod: 'monthly',
    termsAndConditions: '',
    allowExternalInvestors: false,
    referralRewardType: 'percentage',
    referralRewardValue: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageItems, setImageItems] = useState([]);

  // ─── Advisor state ──────────────────────────────────────
  const [advisorsList, setAdvisorsList] = useState([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');

  // ─── Contacts state ─────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showInlineContact, setShowInlineContact] = useState(false);
  const [inlineContact, setInlineContact] = useState({ userId: '', displayName: '', email: '', location: '', expertise: '' });
  const [inlineUserSearch, setInlineUserSearch] = useState('');
  const [showInlineUserDropdown, setShowInlineUserDropdown] = useState(false);
  const { users: allUsers } = useAdminUsers({});

  // Load contacts & advisors on open
  useEffect(() => {
    if (!isOpen) return;
    getAllContacts().then(res => {
      if (res.success) setContacts(res.data);
    });
    getAllAdvisors().then(res => {
      if (res.success) setAdvisorsList(res.data || []);
    });
  }, [isOpen]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contacts;
    const s = contactSearch.toLowerCase();
    return contacts.filter(c =>
      (c.displayName || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.expertise || '').toLowerCase().includes(s)
    );
  }, [contacts, contactSearch]);

  const getUName = (u) => u.displayName || u.fullName || '';

  const filteredInlineUsers = useMemo(() => {
    if (!inlineUserSearch) return allUsers.slice(0, 8);
    const s = inlineUserSearch.toLowerCase();
    return allUsers.filter(u =>
      (u.email || '').toLowerCase().includes(s) ||
      getUName(u).toLowerCase().includes(s)
    ).slice(0, 8);
  }, [allUsers, inlineUserSearch]);

  const toggleContact = (contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(c => c.id === contact.id);
      if (exists) return prev.filter(c => c.id !== contact.id);
      return [...prev, contact];
    });
  };

  const handleCreateInlineContact = async () => {
    if (!inlineContact.userId || !inlineContact.displayName) return;
    const res = await createContact(inlineContact);
    if (res.success) {
      const refreshed = await getAllContacts();
      if (refreshed.success) {
        setContacts(refreshed.data);
        const newContact = refreshed.data.find(c => c.userId === inlineContact.userId);
        if (newContact) setSelectedContacts(prev => [...prev, newContact]);
      }
      setInlineContact({ userId: '', displayName: '', email: '', location: '', expertise: '' });
      setInlineUserSearch('');
      setShowInlineContact(false);
    } else if (res.error === 'ALREADY_EXISTS') {
      Swal.fire({ title: t('contacts.alerts.alreadyExists'), icon: 'warning', background: '#1a1f2e', color: '#fff', confirmButtonColor: '#f59e0b' });
    }
  };

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
      expectedReturn: '',
      returnPeriod: 'monthly',
      allowExternalInvestors: false,
      referralRewardType: 'percentage',
      referralRewardValue: '',
    });
    setError(null);
    setSelectedAdvisorId('');
    setSelectedContacts([]);
    setContactSearch('');
    setShowContactDropdown(false);
    setShowInlineContact(false);
    setInlineContact({ userId: '', displayName: '', email: '', location: '', expertise: '' });
    setInlineUserSearch('');
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
      setError(t('projectForm.errors.nameRequired'));
      return;
    }

    const isFixed = form.type === 'fixed';
    const targetAmountNum = isFixed ? Number(form.targetAmount) : null;
    const minInvestmentNum = isFixed && form.minInvestment !== '' ? Number(form.minInvestment) : null;
    const maxInvestmentNum = isFixed && form.maxInvestment !== '' ? Number(form.maxInvestment) : null;

    if (isFixed) {
      if (!Number.isFinite(targetAmountNum) || targetAmountNum <= 0) {
        setError(t('projectForm.errors.targetRequired'));
        return;
      }

      if (minInvestmentNum !== null) {
        if (!Number.isFinite(minInvestmentNum) || minInvestmentNum <= 0) {
          setError(t('projectForm.errors.minInvestmentPositive'));
          return;
        }
        if (minInvestmentNum > targetAmountNum) {
          setError(t('projectForm.errors.minGreaterThanTarget'));
          return;
        }
      }

      if (maxInvestmentNum !== null) {
        if (!Number.isFinite(maxInvestmentNum) || maxInvestmentNum <= 0) {
          setError(t('projectForm.errors.maxInvestmentPositive'));
          return;
        }
        if (maxInvestmentNum > targetAmountNum) {
          setError(t('projectForm.errors.maxGreaterThanTarget'));
          return;
        }
      }

      if (minInvestmentNum !== null && maxInvestmentNum !== null && minInvestmentNum > maxInvestmentNum) {
        setError(t('projectForm.errors.minGreaterThanMax'));
        return;
      }
    }

    // Validate external investors fields
    if (form.allowExternalInvestors) {
      if (!form.referralRewardType) {
        setError(t('projectForm.errors.referralTypeRequired'));
        return;
      }
      const rewardVal = Number(form.referralRewardValue);
      if (!Number.isFinite(rewardVal) || rewardVal <= 0) {
        setError(t('projectForm.errors.referralValueRequired'));
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        // ─── General ──────────────────────────────────
        general: {
          name: form.name,
          description: form.description?.trim() ? form.description.trim() : null,
          body: form.body?.trim() ? form.body.trim() : null,
          type: form.type,
          category: form.category || null,
          status: 'draft',
          visibleToUsers: true,
          investable: statusToSet === 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },

        // ─── Financials ───────────────────────────────
        financials: {
          targetAmount: isFixed ? targetAmountNum : null,
          capitalRecaudado: 0,
          capitalObjetivo: isFixed ? targetAmountNum : null,
          minInvestment: isFixed ? minInvestmentNum : null,
          maxInvestment: isFixed ? maxInvestmentNum : null,
          totalInvested: 0,
          totalInvestment: 0,
        },

        // ─── Returns ──────────────────────────────────
        returns: {
          expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
          roiAnual: 0,
          roiAcumulado: 0,
          totalROI: null,
          estimatedIRR: null,
          paybackPeriod: null,
          paymentFrequency: 'monthly',
          returnExpected: null,
          expectedReturn: !isFixed && form.expectedReturn ? Number(form.expectedReturn) : null,
          returnPeriod: !isFixed ? (form.returnPeriod || 'monthly') : null,
        },

        // ─── Risk ─────────────────────────────────────
        risk: {
          riskScore: form.riskLevel === 'low' ? 2 : form.riskLevel === 'high' ? 4 : 3,
          riskLevel: form.riskLevel || 'medium',
          countryRisk: false,
          regulatoryRisk: false,
          hasGuarantee: false,
          guaranteeType: '',
          guaranteeValue: null,
        },

        // ─── Duration ─────────────────────────────────
        duration: {
          months: form.durationMonths ? Number(form.durationMonths) : null,
          durationMeses: form.durationMonths ? Number(form.durationMonths) : null,
        },

        // ─── Location ─────────────────────────────────
        location: { country: '', region: '', city: '', assetType: '', operator: '' },

        // ─── Capital Distribution ─────────────────────
        capitalDistribution: { infraestructura: 35, operacion: 25, beneficio: 25, reserva: 15 },

        // ─── Cost Structure ───────────────────────────
        costStructure: { initialCapex: null, minViableCapital: null, monthlyOperatingCost: null },

        // ─── Projections ──────────────────────────────
        projections: { scenario: 'base', monthlyRevenue: null, monthlyCosts: null, operatingMargin: null, contingencyFund: null },

        // ─── Controls ─────────────────────────────────
        controls: {
          manualControl: form.manualControl,
          autoLockOnTarget: isFixed ? true : null,
          kycRequired: true,
        },

        // ─── External Investors / Referrals ───────────
        referral: {
          allowExternalInvestors: form.allowExternalInvestors || false,
          referralRewardType: form.allowExternalInvestors ? form.referralRewardType : null,
          referralRewardValue: form.allowExternalInvestors ? Number(form.referralRewardValue) : null,
        },

        // ─── Restrictions ─────────────────────────────
        restrictions: {
          minInvestment: isFixed ? minInvestmentNum : null,
          maxInvestment: isFixed ? maxInvestmentNum : null,
          maxInvestors: null,
          maxPercentPerInvestor: null,
        },

        // ─── Images (populated after upload) ──────────
        images: { cover: null, gallery: [] },

        // ─── Documents ────────────────────────────────
        documents: { items: [], updatedAt: null },

        // ─── Contacts ─────────────────────────────────
        contacts: selectedContacts.map((c) => ({
          contactId: c.id,
          userId: c.userId,
          displayName: c.displayName || '',
          email: c.email || '',
          expertise: c.expertise || '',
        })),

        // ─── Advisor ──────────────────────────────────
        advisorId: selectedAdvisorId || null,

        // ─── Terms & Conditions ─────────────────────
        termsAndConditions: form.termsAndConditions?.trim() || '',

        // ─── Optional top-level ───────────────────────
        performance: !isFixed && form.performance ? Number(form.performance) : null,
        drawdown: !isFixed && form.drawdown ? Number(form.drawdown) : null,
        paymentCalendar: [],
        charts: {},
        finance: {},
        metrics: {},

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

        const coverImage = uploads[0] || null;
        const galleryImages = uploads.slice(1);

        await updateDoc(docRef, {
          images: {
            cover: coverImage
              ? { url: coverImage.url, path: coverImage.path, updatedAt: serverTimestamp() }
              : null,
            gallery: galleryImages.map((img) => ({ url: img.url, path: img.path })),
          },
          updatedAt: serverTimestamp(),
        });
      }

      // Notify contacts added to this project
      if (selectedContacts.length > 0) {
        await Promise.allSettled(
          selectedContacts.map((c) =>
            notifyContactAddedToProject(c.userId, form.name, docRef.id)
          )
        );
      }

      // Success alert
      await Swal.fire({
        title: t('projectForm.alerts.successTitle'),
        text: t('projectForm.alerts.successText').replace('{name}', form.name),
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: '#1a1f2e',
        color: '#ffffff',
        timer: 2500,
        timerProgressBar: true,
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creando proyecto', err);
      
      await Swal.fire({
        title: t('projectForm.alerts.errorTitle'),
        text: t('projectForm.errors.createFailed'),
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

  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={handleClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('projectForm.title')}</h2>
          <button className="close-btn" onClick={handleClose}></button>
        </div>
        
        <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'draft')}>
          <div className="modal-body">
            <div className="form-section-header">
              <h3>{t('projectForm.generalInfo')}</h3>
              <p>{t('projectForm.generalInfoDesc')}</p>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <h3> {t('projectForm.images')}</h3>
                <p>{t('projectForm.imagesDesc')}</p>
              </div>

              <div className="form-row">
                <label>
                  {t('projectForm.addImages')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addImagesFromFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <span className="field-hint">{t('projectForm.imageHint')}</span>
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
                {t('projectForm.projectName')} *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('projectForm.projectNamePlaceholder')}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {t('projectForm.subtitle')}
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('projectForm.subtitlePlaceholder')}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {t('projectForm.longDescription')}
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={t('projectForm.longDescriptionPlaceholder')}
                  rows={5}
                />
              </label>
            </div>

            <div className="form-row form-row-2">
              <label>
                {t('projectForm.projectType')} *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="fixed">{t('projectForm.typeFixed')}</option>
                  <option value="variable">{t('projectForm.typeVariable')}</option>
                </select>
              </label>
              <label>
                <span className="label-with-badge">
                  {t('projectForm.category')}
                  <span className="label-badge">{t('projectForm.categoryBadge')}</span>
                </span>
                <div className="category-select" onClick={() => setIsCategoryOpen((prev) => !prev)}>
                  <div className="category-control" role="button" tabIndex={0}>
                    <div className="category-value">{form.category || t('projectForm.categoryPlaceholder')}</div>
                    <div className="category-caret">▾</div>
                  </div>
                  {isCategoryOpen && (
                    <div className="category-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder={t('projectForm.searchCategories')}
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
                           {t('projectForm.createCategory')}
                        </button>

                        {showCreateInline && (
                          <div className="inline-create">
                            <label>
                              {t('projectForm.categoryNameLabel')}
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('projectForm.categoryNamePlaceholder')}
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
                                {t('common.cancel')}
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
                                {t('projectForm.createAndSelect')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <span className="field-hint">{t('projectForm.categoryHint')}</span>
              </label>
            </div>

            <div className="form-row form-row-3">
              <label>
                {t('projectForm.riskLevel')} *
                <select
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <option value="low">{t('projectForm.riskLow')}</option>
                  <option value="medium">{t('projectForm.riskMedium')}</option>
                  <option value="high">{t('projectForm.riskHigh')}</option>
                </select>
              </label>
              <label>
                {t('projectForm.expectedROI')}
                <input
                  type="number"
                  step="0.01"
                  value={form.expectedROI}
                  onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
                  placeholder="12"
                />
              </label>
              <label>
                {t('projectForm.duration')}
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
                  <h3> {t('projectForm.fixedConfig')}</h3>
                  <p>{t('projectForm.fixedConfigDesc')}</p>
                </div>
                <div className="form-row form-row-3">
                  <label>
                    {t('projectForm.targetAmount')}
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                      placeholder="500000"
                    />
                  </label>
                  <label>
                    {t('projectForm.minInvestment')}
                    <input
                      type="number"
                      value={form.minInvestment}
                      onChange={(e) => setForm({ ...form, minInvestment: e.target.value })}
                      placeholder="1000"
                    />
                  </label>
                  <label>
                    {t('projectForm.maxInvestment')}
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
                  <h3> {t('projectForm.variableConfig')}</h3>
                  <p>{t('projectForm.variableConfigDesc')}</p>
                </div>
                <div className="form-row form-row-2">
                  <label>
                    {t('projectForm.drawdown')}
                    <input
                      type="number"
                      step="0.01"
                      value={form.drawdown}
                      onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                      placeholder="-5"
                    />
                  </label>
                  <label>
                    {t('projectForm.performance')}
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
                  {t('projectForm.manualControl')}
                </label>
                <div className="form-row form-row-2">
                  <label>
                    {t('projectForm.expectedReturn')}
                    <input
                      type="number"
                      step="0.01"
                      value={form.expectedReturn}
                      onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })}
                      placeholder="10"
                    />
                  </label>
                  <label>
                    {t('projectForm.returnPeriod')}
                    <select
                      value={form.returnPeriod}
                      onChange={(e) => setForm({ ...form, returnPeriod: e.target.value })}
                    >
                      <option value="monthly">{t('projectForm.periodMonthly')}</option>
                      <option value="quarterly">{t('projectForm.periodQuarterly')}</option>
                      <option value="yearly">{t('projectForm.periodYearly')}</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            <div className="form-section form-section-contacts">
              <div className="form-section-header">
                <h3>� {t('projectForm.externalInvestors')}</h3>
                <p>{t('projectForm.externalInvestorsDesc')}</p>
              </div>

              <label className="checkbox-label switch-label">
                <input
                  type="checkbox"
                  checked={form.allowExternalInvestors}
                  onChange={(e) => setForm({ ...form, allowExternalInvestors: e.target.checked })}
                />
                {t('projectForm.allowExternalInvestors')}
              </label>

              {form.allowExternalInvestors && (
                <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
                  <label>
                    {t('projectForm.referralRewardType')} *
                    <select
                      value={form.referralRewardType}
                      onChange={(e) => setForm({ ...form, referralRewardType: e.target.value })}
                    >
                      <option value="percentage">{t('projectForm.rewardPercentage')}</option>
                      <option value="fixed">{t('projectForm.rewardFixed')}</option>
                    </select>
                  </label>
                  <label>
                    {t('projectForm.referralRewardValue')} *
                    <div className="input-with-prefix">
                      <span className="input-prefix">{form.referralRewardType === 'percentage' ? '%' : '$'}</span>
                      <input
                        type="number"
                        step={form.referralRewardType === 'percentage' ? '0.01' : '0.01'}
                        min="0"
                        value={form.referralRewardValue}
                        onChange={(e) => setForm({ ...form, referralRewardValue: e.target.value })}
                        placeholder={form.referralRewardType === 'percentage' ? '5' : '100.00'}
                      />
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="form-section form-section-contacts">
              <div className="form-section-header">
                <h3>�👥 {t('projectForm.contacts')}</h3>
                <p>{t('projectForm.contactsDesc')}</p>
              </div>

              {/* Selected contacts */}
              {selectedContacts.length > 0 && (
                <div className="selected-contacts-list">
                  {selectedContacts.map((c) => (
                    <div key={c.id} className="selected-contact-chip">
                      <div className="sc-avatar">{(c.displayName || '?')[0].toUpperCase()}</div>
                      <div className="sc-info">
                        <span className="sc-name">{c.displayName}</span>
                        <span className="sc-expertise">{c.expertise || c.email}</span>
                      </div>
                      <button type="button" className="sc-remove" onClick={() => toggleContact(c)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact search */}
              <div className="contact-search-wrapper">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder={t('projectForm.searchContacts')}
                />
                {showContactDropdown && filteredContacts.length > 0 && (
                  <div className="contact-dropdown">
                    {filteredContacts.slice(0, 8).map((c) => {
                      const isSelected = selectedContacts.some(sc => sc.id === c.id);
                      return (
                        <div
                          key={c.id}
                          className={`contact-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => { toggleContact(c); setShowContactDropdown(false); setContactSearch(''); }}
                        >
                          <div className="co-avatar">{(c.displayName || '?')[0].toUpperCase()}</div>
                          <div className="co-info">
                            <div className="co-name">{c.displayName}</div>
                            <div className="co-meta">{c.expertise || c.email} {c.location ? `· ${c.location}` : ''}</div>
                          </div>
                          {isSelected && <span className="co-check">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inline contact creation */}
              {!showInlineContact ? (
                <button type="button" className="inline-create-contact-btn" onClick={() => setShowInlineContact(true)}>
                  + {t('projectForm.createContactInline')}
                </button>
              ) : (
                <div className="inline-contact-form">
                  <div className="form-section-header">
                    <h4>{t('projectForm.newContact')}</h4>
                  </div>
                  <div className="form-row">
                    <label>
                      {t('contacts.user')} *
                      <div className="user-search-wrapper">
                        <input
                          type="text"
                          value={inlineUserSearch}
                          onChange={(e) => { setInlineUserSearch(e.target.value); setShowInlineUserDropdown(true); }}
                          onFocus={() => setShowInlineUserDropdown(true)}
                          placeholder={t('contacts.searchUserPlaceholder')}
                        />
                        {showInlineUserDropdown && filteredInlineUsers.length > 0 && (
                          <div className="user-dropdown">
                            {filteredInlineUsers.map((u) => (
                              <div
                                key={u.uid}
                                className="user-option"
                                onClick={() => {
                                  const uName = getUName(u) || u.email || '';
                                  setInlineContact(prev => ({
                                    ...prev,
                                    userId: u.uid,
                                    displayName: uName,
                                    email: u.email || '',
                                  }));
                                  setInlineUserSearch(uName);
                                  setShowInlineUserDropdown(false);
                                }}
                              >
                                <div className="user-option-avatar">{(getUName(u) || u.email || '?')[0].toUpperCase()}</div>
                                <div>
                                  <div className="user-option-name">{getUName(u) || 'Sin nombre'}</div>
                                  <div className="user-option-email">{u.email}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="form-row form-row-2">
                    <label>
                      {t('contacts.location')}
                      <input type="text" value={inlineContact.location} onChange={(e) => setInlineContact(prev => ({ ...prev, location: e.target.value }))} placeholder={t('contacts.locationPlaceholder')} />
                    </label>
                    <label>
                      {t('contacts.expertise')}
                      <input type="text" value={inlineContact.expertise} onChange={(e) => setInlineContact(prev => ({ ...prev, expertise: e.target.value }))} placeholder={t('contacts.expertisePlaceholder')} />
                    </label>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="draft-btn ghost" onClick={() => { setShowInlineContact(false); setInlineContact({ userId: '', displayName: '', email: '', location: '', expertise: '' }); setInlineUserSearch(''); }}>
                      {t('common.cancel')}
                    </button>
                    <button type="button" className="submit-btn compact" onClick={handleCreateInlineContact} disabled={!inlineContact.userId || !inlineContact.displayName}>
                      {t('projectForm.createAndAdd')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Advisor Assignment ──────────────────── */}
            <div className="form-section form-section-contacts">
              <div className="form-section-header">
                <h3>🧑‍💼 {t('projectForm.assignAdvisor')}</h3>
                <p>{t('projectForm.assignAdvisorDesc')}</p>
              </div>
              <div className="form-row">
                <label>
                  {t('projectForm.advisor')}
                  <select
                    value={selectedAdvisorId}
                    onChange={(e) => setSelectedAdvisorId(e.target.value)}
                  >
                    <option value="">{t('projectForm.noAdvisor')}</option>
                    {advisorsList.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}{adv.specialty ? ` — ${adv.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-section form-section-advanced">
              <div className="form-section-header">
                <h3>📄 {t('projectForm.termsAndConditions')}</h3>
                <p>{t('projectForm.termsAndConditionsDesc')}</p>
              </div>
              <div className="form-row">
                <label>
                  <textarea
                    value={form.termsAndConditions}
                    onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
                    placeholder={t('projectForm.termsAndConditionsPlaceholder')}
                    rows={6}
                    className="terms-textarea"
                  />
                </label>
              </div>
            </div>

            <div className="form-section form-section-advanced">
              <div className="form-section-header">
                <h3> {t('projectForm.advancedConfig')}</h3>
                <p>{t('projectForm.advancedConfigDesc')}</p>
              </div>
              <div className="placeholder-box">
                <p>{t('projectForm.advancedPlaceholder')}</p>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="draft-btn" disabled={saving}>
              {saving ? t('projectForm.saving') : t('projectForm.createDraft')}
            </button>
            <button 
              type="button" 
              className="submit-btn" 
              onClick={(e) => handleSubmit(e, 'active')}
              disabled={saving}
            >
              {saving ? t('projectForm.publishing') : t('projectForm.createAndPublish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
