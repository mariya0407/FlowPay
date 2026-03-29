import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';

export function useRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithAuth('/rules', { method: 'GET' });
      setRules(data);
      return data;
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProtocol = async (ruleId: number, payload: any) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await fetchRules();
      return data;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (payload: any) => {
    try {
      const data = await fetchWithAuth('/rules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchRules();
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  return { rules, loading, fetchRules, updateProtocol, createRule };
}
