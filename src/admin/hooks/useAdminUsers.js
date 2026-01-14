import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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

      // Filtro por status
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

      // Filtro por búsqueda (email o displayName)
      let filtered = usersData;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = usersData.filter(u =>
          (u.email?.toLowerCase().includes(search)) ||
          (u.displayName?.toLowerCase().includes(search))
        );
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
  }, [filters.status]);

  const refetch = () => fetchUsers();

  return { users, loading, error, total, refetch };
}
