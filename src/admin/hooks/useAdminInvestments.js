import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
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

      // Evitar índices compuestos: aplicamos como máximo 1 filtro en Firestore,
      // y el resto lo filtramos en cliente.
      const shouldFilterStatus = filters.status && filters.status !== 'all';
      const shouldFilterProjectId = !!filters.projectId;
      const shouldFilterUserId = !!filters.userId;

      const constraints = [];
      if (shouldFilterProjectId) {
        constraints.push(where('projectId', '==', filters.projectId));
      } else if (shouldFilterUserId) {
        constraints.push(where('userId', '==', filters.userId));
      } else if (shouldFilterStatus) {
        constraints.push(where('status', '==', filters.status));
      }

      const q = query(collection(db, 'investments'), ...constraints);

      const snapshot = await getDocs(q);
      const investmentsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Filtros restantes en cliente
      const filtered = investmentsData.filter((inv) => {
        if (shouldFilterProjectId && inv.projectId !== filters.projectId) return false;
        if (shouldFilterUserId && inv.userId !== filters.userId) return false;
        if (shouldFilterStatus && inv.status !== filters.status) return false;
        return true;
      });

      // Ordenar en cliente para evitar índices compuestos (p.ej. projectId + createdAt)
      filtered.sort((a, b) => {
        const aMs = a?.createdAt?.toMillis ? a.createdAt.toMillis() : (a?.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bMs = b?.createdAt?.toMillis ? b.createdAt.toMillis() : (b?.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bMs - aMs;
      });

      // Carga contexto de usuarios y proyectos para eliminar IDs crudos.
      const userIds = [...new Set(filtered.map((inv) => inv.userId).filter(Boolean))];
      const projectIds = [...new Set(filtered.map((inv) => inv.projectId).filter(Boolean))];

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

      const withContext = filtered.map((inv) => {
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
