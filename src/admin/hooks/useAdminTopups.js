import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAdminTopups(filters = {}) {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchTopups = async () => {
    try {
      setLoading(true);
      setError(null);

      let constraints = [];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      const q = query(
        collection(db, 'topups'),
        ...constraints,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const topupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTopups(topupsData);
      setTotal(topupsData.length);
    } catch (err) {
      console.error('Error en useAdminTopups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopups();
  }, [filters.status]);

  const refetch = () => fetchTopups();

  return { topups, loading, error, total, refetch };
}
