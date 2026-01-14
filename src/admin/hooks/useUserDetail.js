import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useUserDetail(uid) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [topups, setTopups] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDetail = async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch usuario
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setError('Usuario no encontrado');
        setLoading(false);
        return;
      }
      setUser({ uid, ...userSnap.data() });

      // Fetch wallet
      const walletRef = doc(db, 'users', uid, 'wallets', uid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        setWallet(walletSnap.data());
      }

      // Fetch investments
      const invQ = query(
        collection(db, 'investments'),
        where('userId', '==', uid)
      );
      const invSnap = await getDocs(invQ);
      setInvestments(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch topups
      const topQ = query(
        collection(db, 'topups'),
        where('userId', '==', uid)
      );
      const topSnap = await getDocs(topQ);
      setTopups(topSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch withdrawals
      const withQ = query(
        collection(db, 'withdrawals'),
        where('userId', '==', uid)
      );
      const withSnap = await getDocs(withQ);
      setWithdrawals(withSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch transactions
      const txQ = query(
        collection(db, 'transactions'),
        where('userId', '==', uid)
      );
      const txSnap = await getDocs(txQ);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error('Error en useUserDetail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [uid]);

  const refetch = () => fetchUserDetail();

  return {
    user,
    wallet,
    investments,
    topups,
    withdrawals,
    transactions,
    loading,
    error,
    refetch
  };
}
