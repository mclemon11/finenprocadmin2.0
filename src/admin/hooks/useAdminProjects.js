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
        const isFixed = p.type === 'fixed';
        const target = Number(p.targetAmount || 0);
        const invested = Number(p.totalInvested || 0);
        const reached = isFixed && target > 0 && invested >= target;
        const computedStatus = reached ? 'funded' : (p.status || 'draft');
        const investable = computedStatus === 'active' && !reached && p.status !== 'paused' && p.status !== 'closed';

        return {
          ...p,
          computedStatus,
          progress: target > 0 ? Math.min(100, Number(((invested / target) * 100).toFixed(2))) : null,
          isTargetReached: reached,
          investable,
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
