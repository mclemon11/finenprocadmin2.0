import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

/**
 * Build a liquidity-vs-obligations timeline from topups, withdrawals and investments.
 * Groups data into buckets (days/weeks) over the given number of days looking back from today.
 */
function buildLiquidityTimeline(topups, withdrawals, investments, daysBack) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  // Decide bucket size: <=7 -> daily, <=30 -> every ~3 days, 90 -> weekly
  const bucketDays = daysBack <= 7 ? 1 : daysBack <= 30 ? 3 : 7;
  const bucketCount = Math.ceil(daysBack / bucketDays);

  // Build empty buckets
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const bStart = new Date(start);
    bStart.setDate(bStart.getDate() + i * bucketDays);
    const bEnd = new Date(bStart);
    bEnd.setDate(bEnd.getDate() + bucketDays);
    const label = bStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    buckets.push({ label, start: bStart, end: bEnd, inflow: 0, outflow: 0 });
  }

  const toDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate();
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Inflows from approved topups
  topups.forEach(t => {
    if (t.status !== 'approved') return;
    const d = toDate(t.updatedAt || t.createdAt);
    if (!d || d < start) return;
    const bucket = buckets.find(b => d >= b.start && d < b.end);
    if (bucket) bucket.inflow += (t.amount || 0);
  });

  // Outflows from approved/completed withdrawals
  withdrawals.forEach(w => {
    if (w.status !== 'approved' && w.status !== 'completed' && w.status !== 'paid') return;
    const d = toDate(w.updatedAt || w.createdAt);
    if (!d || d < start) return;
    const bucket = buckets.find(b => d >= b.start && d < b.end);
    if (bucket) bucket.outflow += (w.amount || 0);
  });

  // Outflows from active investments (capital locked)
  investments.forEach(inv => {
    if (inv.status !== 'active') return;
    const d = toDate(inv.createdAt);
    if (!d || d < start) return;
    const bucket = buckets.find(b => d >= b.start && d < b.end);
    if (bucket) bucket.outflow += (inv.amount || 0);
  });

  // Convert to cumulative liquidity
  let cumulativeLiq = 0;
  return buckets.map(b => {
    cumulativeLiq += b.inflow;
    return { label: b.label, liquidity: cumulativeLiq };
  });
}

export default function useDashboardKPIs() {
  const [kpis, setKpis] = useState({
    totalCapital: 0,
    capitalInvested: 0,
    availableLiquidity: 0,
    pendingDeposits: 0,
    pendingDepositAmount: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
    activeInvestors: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingTopups: 0,
    approvedTopups: 0,
    rejectedTopups: 0,
    totalTopups: 0,
    activeInvestments: 0,
    totalInvested: 0,
    recentTransactions: [],
    upcomingPayments: [],
    // Raw data for chart filtering
    _topups: [],
    _withdrawals: [],
    _investments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Users + wallets
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;

      // Fetch all wallets for total capital
      let totalWalletBalance = 0;
      const walletPromises = users.map(async (u) => {
        try {
          const wSnap = await getDocs(collection(db, `users/${u.id}/wallets`));
          let bal = 0;
          wSnap.docs.forEach(wd => { bal += (wd.data().balance || 0); });
          return bal;
        } catch { return 0; }
      });
      const walletBalances = await Promise.all(walletPromises);
      totalWalletBalance = walletBalances.reduce((a, b) => a + b, 0);

      // Topups
      const topupsSnap = await getDocs(collection(db, 'topups'));
      const topups = topupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pendingTopups = topups.filter(t => t.status === 'pending').length;
      const pendingDepositAmount = topups.filter(t => t.status === 'pending').reduce((a, t) => a + (t.amount || 0), 0);
      const approvedTopups = topups.filter(t => t.status === 'approved').length;
      const rejectedTopups = topups.filter(t => t.status === 'rejected').length;
      const totalTopupsCount = topups.length;

      // Withdrawals
      const withdrawalsSnap = await getDocs(collection(db, 'withdrawals'));
      const withdrawals = withdrawalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const pendingWithdrawalAmount = withdrawals.filter(w => w.status === 'pending').reduce((a, w) => a + (w.amount || 0), 0);

      // Investments
      const allInvSnap = await getDocs(collection(db, 'investments'));
      const allInvestments = allInvSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeInvestments = allInvestments.filter(i => i.status === 'active');
      const totalInvested = activeInvestments.reduce((acc, inv) => acc + (inv.amount || 0), 0);

      // Active investors = unique users with at least one active investment
      const activeInvestorSet = new Set(activeInvestments.map(i => i.userId));
      const activeInvestors = activeInvestorSet.size;

      // Derive financial metrics
      const totalCapital = totalWalletBalance + totalInvested;
      const availableLiquidity = totalWalletBalance;

      // Payouts (upcoming payments)
      const payoutsSnap = await getDocs(collection(db, 'payouts'));
      const payouts = payoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const upcomingPayments = payouts
        .filter(p => p.status === 'pending' || p.status === 'scheduled')
        .sort((a, b) => {
          const da = a.dueDate?.toDate?.() || a.dueDate || new Date(a.createdAt?.toDate?.() || 0);
          const db2 = b.dueDate?.toDate?.() || b.dueDate || new Date(b.createdAt?.toDate?.() || 0);
          return da - db2;
        })
        .slice(0, 10)
        .map(p => {
          const user = users.find(u => u.id === p.userId);
          return {
            ...p,
            userName: user?.displayName || user?.email || 'Unknown',
            projectName: p.projectName || 'N/A'
          };
        });

      // Recent transactions (last 10)
      const txQ = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const txSnap = await getDocs(txQ);
      const recentTransactions = txSnap.docs.slice(0, 10).map(d => {
        const data = d.data();
        const user = users.find(u => u.id === data.userId);
        return {
          id: d.id,
          ...data,
          userEmail: user?.email || data.userEmail || 'N/A',
          userName: user?.displayName || ''
        };
      });

      setKpis({
        totalCapital,
        capitalInvested: totalInvested,
        availableLiquidity,
        pendingDeposits: pendingTopups,
        pendingDepositAmount,
        pendingWithdrawals,
        pendingWithdrawalAmount,
        activeInvestors,
        totalUsers,
        activeUsers,
        pendingTopups,
        approvedTopups,
        rejectedTopups,
        totalTopups: totalTopupsCount,
        activeInvestments: activeInvestments.length,
        totalInvested,
        recentTransactions,
        upcomingPayments,
        _topups: topups,
        _withdrawals: withdrawals,
        _investments: allInvestments
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

  /**
   * Build chart data for a given period string: '7D', '30D', '90D'
   */
  const getChartData = (period = '30D') => {
    const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
    const days = daysMap[period] || 30;
    return buildLiquidityTimeline(kpis._topups, kpis._withdrawals, kpis._investments, days);
  };

  return { kpis, loading, error, refetch, getChartData };
}
