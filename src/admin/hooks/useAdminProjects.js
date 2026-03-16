import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

// Carga proyectos con metadatos básicos. Se usa para enriquecer inversiones y para la vista /admin/proyectos.
export default function useAdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const base = collection(db, 'projects');
      const q = query(base, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const enriched = data.map((p) => {
        // Read from new nested structure with legacy fallback
        const generalType = p.general?.type || p.type || 'fixed';
        const generalStatus = p.general?.status || p.status || 'draft';
        const generalName = p.general?.name || p.name || '';
        const generalCategory = p.general?.category || p.category || '';
        const generalDescription = p.general?.description || p.description || '';
        const generalVisibleToUsers = p.general?.visibleToUsers ?? p.visibleToUsers ?? true;

        const isFixed = generalType === 'fixed';
        const target = Number(p.financials?.targetAmount || p.finance?.targetAmount || p.targetAmount || 0);
        const invested = Number(p.financials?.totalInvested || p.totalInvested || 0);
        const reached = isFixed && target > 0 && invested >= target;
        const computedStatus = reached ? 'funded' : generalStatus;
        const computedInvestable = computedStatus === 'active' && !reached && generalStatus !== 'paused' && generalStatus !== 'closed';

        const expectedROI = p.returns?.expectedROI || p.metrics?.expectedROI || p.expectedROI || null;
        const durationMonths = (typeof p.duration === 'object' ? p.duration?.months : null) || p.metrics?.duration || (typeof p.duration === 'number' ? p.duration : null) || null;
        const riskLevel = p.risk?.riskLevel || p.risks?.riskLevel || p.riskLevel || 'medium';
        const minInvestment = p.financials?.minInvestment || p.restrictions?.minInvestment || p.minInvestment || null;
        const maxInvestment = p.financials?.maxInvestment || p.restrictions?.maxInvestment || p.maxInvestment || null;

        // Resolve images: new nested format or legacy flat
        let imageUrl = null;
        let images = [];
        if (p.images?.cover?.url || Array.isArray(p.images?.gallery)) {
          imageUrl = p.images?.cover?.url || null;
          images = [
            ...(p.images?.cover?.url ? [p.images.cover.url] : []),
            ...(Array.isArray(p.images?.gallery) ? p.images.gallery.map(g => g?.url).filter(Boolean) : []),
          ];
        } else {
          images = Array.isArray(p.images) ? p.images.filter(u => typeof u === 'string' && u.trim()) : [];
          imageUrl = p.imageUrl || images[0] || null;
        }

        return {
          ...p,
          // Flatten key fields for easy access across the admin
          name: generalName,
          category: generalCategory,
          description: generalDescription,
          body: p.general?.body || p.body || '',
          type: generalType,
          status: generalStatus,
          visibleToUsers: generalVisibleToUsers,
          targetAmount: target,
          totalInvested: invested,
          expectedROI,
          duration: durationMonths,
          riskLevel,
          minInvestment,
          maxInvestment,
          imageUrl,
          images,
          investable: p.general?.investable ?? computedInvestable,
          autoLockOnTarget: p.controls?.autoLockOnTarget ?? p.autoLockOnTarget ?? true,
          manualControl: p.controls?.manualControl ?? p.manualControl ?? true,
          performance: p.performance ?? null,
          drawdown: p.drawdown ?? null,
          expectedReturn: p.returns?.expectedReturn || null,
          returnPeriod: p.returns?.returnPeriod || null,
          createdAt: p.general?.createdAt || p.createdAt || null,
          updatedAt: p.general?.updatedAt || p.updatedAt || null,
          // Referral / External Investors
          allowExternalInvestors: p.referral?.allowExternalInvestors ?? p.allowExternalInvestors ?? false,
          referralRewardType: p.referral?.referralRewardType || p.referralRewardType || null,
          referralRewardValue: p.referral?.referralRewardValue || p.referralRewardValue || null,
          // Advisor
          advisorId: p.advisorId || null,
          // Computed
          computedStatus,
          progress: target > 0 ? Math.min(100, Number(((invested / target) * 100).toFixed(2))) : null,
          isTargetReached: reached,
        };
      });

      setProjects(enriched);
    } catch (err) {
      console.error('Error en useAdminProjects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const refetch = () => fetchProjects();

  return { projects, loading, error, refetch };
}
