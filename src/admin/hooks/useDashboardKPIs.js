import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useDashboardKPIs() {
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingTopups: 0,
    approvedTopups: 0,
    totalTopups: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
    totalInvested: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usuarios
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => d.data());
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;

      // Topups
      const topupsSnap = await getDocs(collection(db, 'topups'));
      const topups = topupsSnap.docs.map(d => d.data());
      const pendingTopups = topups.filter(t => t.status === 'pending').length;
      const approvedTopups = topups.filter(t => t.status === 'approved').length;
      const totalTopups = topups.length;

      // Withdrawals
      const withdrawalsSnap = await getDocs(collection(db, 'withdrawals'));
      const withdrawals = withdrawalsSnap.docs.map(d => d.data());
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

      // Investments
      const invQ = query(
        collection(db, 'investments'),
        where('status', '==', 'active')
      );
      const invSnap = await getDocs(invQ);
      const investments = invSnap.docs.map(d => d.data());
      const activeInvestments = investments.length;
      const totalInvested = investments.reduce((acc, inv) => acc + (inv.amount || 0), 0);

      // Transacciones recientes
      const txQ = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc')
      );
      const txSnap = await getDocs(txQ);
      const recentTransactions = txSnap.docs.slice(0, 10).map(d => ({
        id: d.id,
        ...d.data()
      }));

      setKpis({
        totalUsers,
        activeUsers,
        pendingTopups,
        approvedTopups,
        totalTopups,
        pendingWithdrawals,
        activeInvestments,
        totalInvested,
        recentTransactions
      });
    } catch (err) {
      console.error('Error en useDashboardKPIs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const refetch = () => fetchKPIs();

  return { kpis, loading, error, refetch };
}
