import { useState, useEffect } from 'react';
import { getAllTopups } from '../services/adminTopups.service';

/**
 * Hook to manage admin topups data and filtering
 * @returns {{topups: Array, filters: Object, setFilters: Function, loading: boolean, error: string|null}}
 */
export const useAdminTopups = () => {
  const [topups, setTopups] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    searchQuery: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopups = async () => {
      setLoading(true);
      setError(null);

      const serviceFilters = {};
      if (filters.status) {
        serviceFilters.status = filters.status;
      }

      const result = await getAllTopups(serviceFilters);

      if (result.success) {
        let filteredTopups = result.data || [];

        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          filteredTopups = filteredTopups.filter(topup =>
            topup.user?.email?.toLowerCase().includes(query) ||
            topup.user?.displayName?.toLowerCase().includes(query)
          );
        }

        setTopups(filteredTopups);
      } else {
        setError(result.error || 'Error al cargar recargas');
      }

      setLoading(false);
    };

    fetchTopups();
  }, [filters.status]);

  const handleSearchChange = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  return {
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
