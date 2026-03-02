import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where, startAfter } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAuditLogs(filters = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ adminActions: 0, securityAlerts: 0, financialTotal: 0 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      let allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Client-side filtering
      if (filters.search) {
        const s = filters.search.toLowerCase();
        allLogs = allLogs.filter(l =>
          (l.adminEmail?.toLowerCase().includes(s)) ||
          (l.action?.toLowerCase().includes(s)) ||
          (l.targetId?.toLowerCase().includes(s)) ||
          (l.details?.toLowerCase().includes(s))
        );
      }

      if (filters.type && filters.type !== 'all') {
        allLogs = allLogs.filter(l => l.action?.includes(filters.type));
      }

      if (filters.period === '7d') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        allLogs = allLogs.filter(l => {
          const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
          return d >= cutoff;
        });
      } else if (filters.period === '30d') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        allLogs = allLogs.filter(l => {
          const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
          return d >= cutoff;
        });
      }

      // Compute stats from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = allLogs.filter(l => {
        const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
        return d >= today;
      });

      const adminActions = todayLogs.length;
      const securityAlerts = todayLogs.filter(l =>
        l.action?.includes('failed_login') || l.action?.includes('security')
      ).length;
      const financialTotal = todayLogs
        .filter(l => ['approve_topup', 'approve_withdrawal', 'distribute_returns', 'approve_investment'].includes(l.action))
        .reduce((a, l) => a + (l.amount || 0), 0);

      setStats({ adminActions, securityAlerts, financialTotal });
      setLogs(allLogs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.search, filters.type, filters.period]);

  return { logs, loading, error, stats, refetch: fetchLogs };
}
