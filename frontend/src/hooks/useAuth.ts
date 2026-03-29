import { useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { login, logout, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      login(data.user, data.token);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerOrganization = async (payload: any) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loginUser,
    registerOrganization,
    logout,
    loading,
    error,
  };
}
