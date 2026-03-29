import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';

export function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithAuth('/expenses', { method: 'GET' });
      setExpenses(data);
      return data;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitExpense = async (payload: any) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchExpenses(); // Refresh list automatically
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeApprovalAction = async (expenseId: number, action: 'Approve' | 'Reject', comments?: string) => {
     try {
       const data = await fetchWithAuth(`/expenses/${expenseId}/approve`, {
         method: 'POST',
         body: JSON.stringify({ action, comments }),
       });
       return data;
     } catch (err: any) {
       throw err;
     }
  }

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    submitExpense,
    executeApprovalAction
  };
}
