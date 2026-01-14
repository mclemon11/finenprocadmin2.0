import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAdminWithdrawals(filters = {}) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      let constraints = [];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      const q = query(
        collection(db, 'withdrawals'),
        ...constraints,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const withdrawalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setWithdrawals(withdrawalsData);
      setTotal(withdrawalsData.length);
    } catch (err) {
      console.error('Error en useAdminWithdrawals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filters.status]);

  const refetch = () => fetchWithdrawals();

  return { withdrawals, loading, error, total, refetch };
}
