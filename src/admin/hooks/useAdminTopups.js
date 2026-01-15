import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
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

      const normalizeDate = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (value?.toDate) return value.toDate().toISOString();
        if (value instanceof Date) return value.toISOString();
        return null;
      };

      // Enrich topups with user email/name from /users/{uid} when available.
      // Note: If a user only exists in Firebase Auth and not in Firestore, the client cannot fetch their email by UID.
      const userIds = [...new Set(topupsData.map((t) => t.userId).filter(Boolean))];
      const userEntries = await Promise.all(
        userIds.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return [uid, snap.exists() ? snap.data() : null];
        })
      );
      const usersMap = Object.fromEntries(userEntries);

      const enriched = topupsData.map((t) => {
        const user = usersMap[t.userId] || null;
        return {
          ...t,
          userEmail: t.userEmail || user?.email || null,
          userName: t.userName || user?.displayName || user?.fullName || null,
          createdAt: normalizeDate(t.createdAt) || t.createdAt,
        };
      });

      setTopups(enriched);
      setTotal(enriched.length);
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
