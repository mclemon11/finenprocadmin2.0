import React, { useState, useMemo } from 'react';
import useDistribution from '../hooks/useDistribution';
import { useLanguage } from '../../context/LanguageContext';
import './DistributionPage.css';

export default function DistributionPage({ adminData }) {
  const { projects, selectedProject, setSelectedProject, investors, loading, distributing, error, distributeReturns } = useDistribution();
  const { t } = useLanguage();
  const [returnAmount, setReturnAmount] = useState('');
  const [feePercent] = useState(0.5);
  const [showConfirm, setShowConfirm] = useState(false);

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v || 0);

  const totalInvested = useMemo(() => investors.reduce((a, i) => a + (i.amount || 0), 0), [investors]);
  const numericReturn = parseFloat(returnAmount) || 0;
  const fee = numericReturn * (feePercent / 100);
  const netReturn = numericReturn - fee;

  const handleDistribute = async () => {
    if (!selectedProject || numericReturn <= 0) return;
    const success = await distributeReturns(
      selectedProject.id,
      numericReturn,
      adminData?.uid,
      adminData?.email,
      feePercent
    );
    if (success) {
      setShowConfirm(false);
      setReturnAmount('');
      setSelectedProject(null);
    }
  };

  return (
    <div className="distribution-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('distribution.title')}</h1>
          <p className="page-subtitle">{t('distribution.subtitle')}</p>
        </div>
      </div>

      <div className="distribution-layout">
        {/* Left: Input Form */}
        <div className="distribution-form-panel">
          <div className="form-card">
            <h3 className="form-card-title">{t('distribution.details')}</h3>

            <label className="form-label">{t('distribution.selectProject')}</label>
            <select
              className="form-select"
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const p = projects.find(pr => pr.id === e.target.value);
                setSelectedProject(p || null);
              }}
            >
              <option value="">{t('distribution.chooseProject')}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>

            <label className="form-label">{t('distribution.returnAmount')}</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">$</span>
              <input
                type="number"
                className="form-input amount-input"
                placeholder="0.00"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
              />
            </div>

            {selectedProject && numericReturn > 0 && (
              <div className="distribution-summary">
                <div className="summary-row">
                  <span>{t('distribution.investorCount')}</span>
                  <span className="summary-value">{investors.length}</span>
                </div>
                <div className="summary-row">
                  <span>{t('distribution.processingFee')} ({feePercent}%)</span>
                  <span className="summary-value fee">-{formatCurrency(fee)}</span>
                </div>
                <div className="summary-row net">
                  <span>{t('distribution.netDistribution')}</span>
                  <span className="summary-value">{formatCurrency(netReturn)}</span>
                </div>
              </div>
            )}

            <button
              className="btn-distribute"
              disabled={!selectedProject || numericReturn <= 0 || distributing || investors.length === 0}
              onClick={() => setShowConfirm(true)}
            >
              {distributing ? t('common.processing') : t('distribution.distributeReturns')}
            </button>
          </div>

          {error && <div className="distribution-error">{error}</div>}
        </div>

        {/* Right: Preview Table */}
        <div className="distribution-preview-panel">
          <div className="preview-card">
            <div className="preview-header">
              <h3 className="preview-title">{t('distribution.preview')}</h3>
            </div>

            {loading ? (
              <div className="preview-loading">{t('common.loading')}</div>
            ) : investors.length === 0 ? (
              <div className="preview-empty">
                {selectedProject ? t('distribution.noInvestors') : t('distribution.selectProjectFirst')}
              </div>
            ) : (
              <>
                <div className="preview-table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>{t('distribution.investor')}</th>
                        <th style={{ textAlign: 'right' }}>{t('distribution.share')}</th>
                        <th style={{ textAlign: 'right' }}>{t('distribution.invested')}</th>
                        <th style={{ textAlign: 'right' }}>{t('distribution.calculatedReturn')}</th>
                        <th style={{ textAlign: 'center' }}>{t('distribution.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investors.map((inv, i) => {
                        const share = totalInvested > 0 ? inv.amount / totalInvested : 0;
                        const calcReturn = netReturn * share;
                        return (
                          <tr key={inv.id || i}>
                            <td>
                              <div className="investor-cell">
                                <div className="investor-avatar">{(inv.userName || '?').charAt(0).toUpperCase()}</div>
                                <div>
                                  <span className="investor-name">{inv.userName}</span>
                                  <span className="investor-id">{inv.userId?.slice(0, 8)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="text-right mono">{(share * 100).toFixed(2)}%</td>
                            <td className="text-right">{formatCurrency(inv.amount)}</td>
                            <td className="text-right return-value">{formatCurrency(calcReturn)}</td>
                            <td className="text-center">
                              <span className={`badge-sm badge-${inv.status === 'active' ? 'success' : 'pending'}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="preview-footer">
                  {t('distribution.showing')} {investors.length} {t('distribution.investors')}
                </div>
              </>
            )}
          </div>

          {numericReturn > 0 && (
            <div className="distribution-warning">
               {t('distribution.warning')}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('distribution.confirmTitle')}</h3>
            <p>{t('distribution.confirmMessage')}</p>
            <div className="confirm-details">
              <div className="confirm-row"><span>{t('distribution.project')}:</span><strong>{selectedProject?.name}</strong></div>
              <div className="confirm-row"><span>{t('distribution.totalReturn')}:</span><strong>{formatCurrency(numericReturn)}</strong></div>
              <div className="confirm-row"><span>{t('distribution.netDistribution')}:</span><strong>{formatCurrency(netReturn)}</strong></div>
              <div className="confirm-row"><span>{t('distribution.recipients')}:</span><strong>{investors.length}</strong></div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" onClick={handleDistribute} disabled={distributing}>
                {distributing ? t('common.processing') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
