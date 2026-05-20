/* ── CUSTOM HOOK: useApi — wrapper untuk API calls dengan loading dan error state ── */
import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * useApi — Hook untuk membungkus API call dengan state management otomatis.
 *
 * Penggunaan:
 *   const { data, loading, error, execute } = useApi();
 *   await execute(() => api.get('/dashboard/stats'));
 */
export function useApi() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (apiFn) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * useApiState — Hook sederhana untuk data fetching dengan auto-fetch saat mount.
 *
 * Penggunaan:
 *   const { data, loading, error, refetch } = useApiState(() => api.get('/user'));
 */
export function useApiState(apiFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      setError(message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetch };
}

export default useApi;
