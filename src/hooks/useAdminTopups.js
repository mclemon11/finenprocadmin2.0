import { useState, useEffect } from 'react';
import { getAllTopups } from '../services/adminTopups.service';

/**
 * Hook to manage admin topups data and filtering
 * @returns {{topups: Array, filters: Object, setFilters: Function, loading: boolean, error: string|null}}
 */
export const useAdminTopups = () => {
  const [allTopups, setAllTopups] = useState([]);
  const [topups, setTopups] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    searchQuery: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch once; filter in-memory to support counts and fast searching.
  useEffect(() => {
    const fetchTopups = async () => {
      setLoading(true);
      setError(null);

      const result = await getAllTopups({});
      if (result.success) {
        setAllTopups(result.data || []);
      } else {
        setAllTopups([]);
        setError(result.error || 'Error al cargar recargas');
      }

      setLoading(false);
    };

    fetchTopups();
  }, []);

  useEffect(() => {
    let filteredTopups = allTopups;

    if (filters.status) {
      filteredTopups = filteredTopups.filter((t) => t.status === filters.status);
    }

    if (filters.searchQuery.trim()) {
      const queryText = filters.searchQuery.toLowerCase();
      filteredTopups = filteredTopups.filter((topup) =>
        topup.user?.email?.toLowerCase().includes(queryText) ||
        topup.user?.displayName?.toLowerCase().includes(queryText)
      );
    }

    setTopups(filteredTopups);
  }, [allTopups, filters.status, filters.searchQuery]);

  const handleSearchChange = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  return {
    allTopups,
    topups,
    filters,
    setFilters: {
      status: (status) => setFilters(prev => ({ ...prev, status })),
      searchQuery: handleSearchChange
    },
    loading,
    error
  };
};
