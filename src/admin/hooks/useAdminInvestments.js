import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAdminInvestments(filters = {}) {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      setError(null);

      let constraints = [];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.projectId) {
        constraints.push(where('projectId', '==', filters.projectId));
      }

      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      const q = query(
        collection(db, 'investments'),
        ...constraints,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const investmentsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Carga contexto de usuarios y proyectos para eliminar IDs crudos.
      const userIds = [...new Set(investmentsData.map((inv) => inv.userId).filter(Boolean))];
      const projectIds = [...new Set(investmentsData.map((inv) => inv.projectId).filter(Boolean))];

      const [userEntries, projectEntries] = await Promise.all([
        Promise.all(userIds.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return [uid, snap.exists() ? snap.data() : null];
        })),
        Promise.all(projectIds.map(async (pid) => {
          const snap = await getDoc(doc(db, 'projects', pid));
          return [pid, snap.exists() ? snap.data() : null];
        }))
      ]);

      const usersMap = Object.fromEntries(userEntries);
      const projectsMap = Object.fromEntries(projectEntries);

      const calcROI = (amount, target) => {
        if (!amount || !target) return null;
        return Number(((target - amount) / amount * 100).toFixed(2));
      };

      const withContext = investmentsData.map((inv) => {
        const user = usersMap[inv.userId] || {};
        const project = projectsMap[inv.projectId] || {};
        return {
          ...inv,
          userEmail: user.email || '—',
          userName: user.displayName || user.fullName || '—',
          projectName: project.name || '—',
          expectedROI: calcROI(inv.amount, inv.expectedReturn),
          actualROI: calcROI(inv.amount, inv.actualReturn || inv.realizedReturn || inv.payout)
        };
      });

      setInvestments(withContext);
      setTotal(withContext.length);
      const sum = withContext.reduce((acc, inv) => acc + (inv.amount || 0), 0);
      setTotalAmount(sum);
    } catch (err) {
      console.error('Error en useAdminInvestments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [filters.status, filters.projectId, filters.userId]);

  const refetch = () => fetchInvestments();

  return { investments, loading, error, total, totalAmount, refetch };
}
