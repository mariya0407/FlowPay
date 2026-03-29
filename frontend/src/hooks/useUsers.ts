import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchWithAuth('/users', { method: 'GET' });
      setUsers(data);
      return data;
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTalent = async (payload: any) => {
    try {
      const data = await fetchWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      fetchUsers();
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const updateIdentity = async (userId: number, payload: any) => {
    try {
      const data = await fetchWithAuth(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload), // { role, managerId } mapping identically to the UI dropdowns
      });
      fetchUsers();
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const terminateUser = async (userId: number) => {
     try {
      await fetchWithAuth(`/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter(u => u.id !== userId));
     } catch(err: any) {
       throw err;
     }
  }

  return { users, loading, fetchUsers, assignTalent, updateIdentity, terminateUser };
}
