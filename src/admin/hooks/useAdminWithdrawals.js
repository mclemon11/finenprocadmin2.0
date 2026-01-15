import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  getDoc,
  doc,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function useAdminWithdrawals(filters = {}) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  const [pageSize, setPageSize] = useState(filters.pageSize || 25);
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([]); // lastDoc per page (page 1 has none)
  const [hasNextPage, setHasNextPage] = useState(false);

  const status = filters.status || 'all';

  const normalizeDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value?.toDate) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    return null;
  };

  const fetchCounts = async () => {
    try {
      const base = collection(db, 'withdrawals');
      const [all, pending, approved, rejected] = await Promise.all([
        getCountFromServer(query(base)),
        getCountFromServer(query(base, where('status', '==', 'pending'))),
        getCountFromServer(query(base, where('status', '==', 'approved'))),
        getCountFromServer(query(base, where('status', '==', 'rejected'))),
      ]);

      setCounts({
        all: all.data().count,
        pending: pending.data().count,
        approved: approved.data().count,
        rejected: rejected.data().count,
      });
    } catch (err) {
      // Non-blocking: counts are for UI only
      console.warn('useAdminWithdrawals counts error', err);
    }
  };

  const fetchWithdrawals = async ({ nextPageSize = pageSize, nextPage = page, nextCursors = cursors } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const constraints = [];
      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }

      // Pagination cursor: page 1 => none; page N => startAfter(cursors[N-2])
      const cursorForPage = nextPage > 1 ? nextCursors[nextPage - 2] : null;
      if (cursorForPage) {
        constraints.push(startAfter(cursorForPage));
      }

      const q = query(
        collection(db, 'withdrawals'),
        ...constraints,
        orderBy('createdAt', 'desc'),
        limit(Number(nextPageSize) + 1)
      );

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > Number(nextPageSize);
      const pageDocs = hasMore ? docs.slice(0, Number(nextPageSize)) : docs;

      setHasNextPage(hasMore);

      // Store cursor (last doc) for this page so we can navigate forward/backward.
      if (pageDocs.length) {
        const lastDoc = pageDocs[pageDocs.length - 1];
        setCursors((prev) => {
          const next = [...prev];
          // cursor for page N is stored at index N-1
          next[nextPage - 1] = lastDoc;
          return next;
        });
      }

      const withdrawalsData = pageDocs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Enrich with user context (email/displayName) for the current page.
      const userIds = [...new Set(withdrawalsData.map((w) => w.userId).filter(Boolean))];
      const userEntries = await Promise.all(
        userIds.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return [uid, snap.exists() ? snap.data() : null];
        })
      );
      const usersMap = Object.fromEntries(userEntries);

      const normalized = withdrawalsData.map((w) => {
        const user = usersMap[w.userId] || null;
        return {
          ...w,
          userEmail: w.userEmail || user?.email || null,
          userName: w.userName || user?.displayName || user?.fullName || null,
          createdAt: normalizeDate(w.createdAt) || w.createdAt,
        };
      });

      setWithdrawals(normalized);
      // Total depends on counts for the filter; fallback to current loaded size.
      const totalForStatus = status === 'pending' ? counts.pending
        : status === 'approved' ? counts.approved
          : status === 'rejected' ? counts.rejected
            : counts.all;
      setTotal(Number.isFinite(totalForStatus) && totalForStatus > 0 ? totalForStatus : normalized.length);
    } catch (err) {
      console.error('Error en useAdminWithdrawals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset pagination when status changes
    setPage(1);
    setCursors([]);
    if (filters.pageSize) setPageSize(filters.pageSize);
    fetchCounts();
    fetchWithdrawals({ nextPage: 1, nextCursors: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // When pageSize changes, reset to first page
    setPage(1);
    setCursors([]);
    fetchWithdrawals({ nextPageSize: pageSize, nextPage: 1, nextCursors: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  useEffect(() => {
    fetchWithdrawals({ nextPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const refetch = () => {
    fetchCounts();
    fetchWithdrawals({ nextPage: page });
  };

  const nextPage = () => {
    if (!hasNextPage) return;
    setPage((p) => p + 1);
  };

  const prevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const setPageSizeSafe = (next) => {
    const size = Number(next);
    if (!Number.isFinite(size) || size <= 0) return;
    setPageSize(size);
  };

  return {
    withdrawals,
    loading,
    error,
    total,
    counts,
    page,
    pageSize,
    hasNextPage,
    nextPage,
    prevPage,
    setPageSize: setPageSizeSafe,
    refetch,
  };
}
