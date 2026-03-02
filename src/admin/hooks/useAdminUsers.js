import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAdminUsers(filters = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let constraints = [];
      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      const q = query(
        collection(db, 'users'),
        ...constraints,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      // Enrich with wallet balances & investment summaries
      const enriched = await Promise.all(usersData.map(async (u) => {
        try {
          const walletRef = doc(db, 'users', u.uid, 'wallets', u.uid);
          const walletSnap = await getDoc(walletRef);
          const walletBalance = walletSnap.exists() ? Number(walletSnap.data().balance || 0) : 0;

          const invQ = query(collection(db, 'investments'), where('userId', '==', u.uid));
          const invSnap = await getDocs(invQ);
          let totalInvested = 0;
          let totalEarned = 0;
          let activeInvestments = 0;
          invSnap.docs.forEach(d => {
            const inv = d.data();
            totalInvested += Number(inv.amount || 0);
            totalEarned += Number(inv.realizedReturn || 0);
            if (inv.status === 'active') activeInvestments++;
          });

          return { ...u, walletBalance, totalInvested, totalEarned, activeInvestments };
        } catch {
          return { ...u, walletBalance: 0, totalInvested: 0, totalEarned: 0, activeInvestments: 0 };
        }
      }));

      // Client-side search filter
      let filtered = enriched;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = enriched.filter(u =>
          (u.email?.toLowerCase().includes(search)) ||
          (u.displayName?.toLowerCase().includes(search))
        );
      }

      // Client-side special filter chips
      if (filters.chip === 'hasBalance') {
        filtered = filtered.filter(u => u.walletBalance > 0);
      } else if (filters.chip === 'hasActive') {
        filtered = filtered.filter(u => u.activeInvestments > 0);
      } else if (filters.chip === 'highCapital') {
        filtered = filtered.filter(u => u.totalInvested >= 10000);
      }

      setUsers(filtered);
      setTotal(filtered.length);
    } catch (err) {
      console.error('Error en useAdminUsers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.status, filters.search, filters.chip]);

  const refetch = () => fetchUsers();

  return { users, loading, error, total, refetch };
}
