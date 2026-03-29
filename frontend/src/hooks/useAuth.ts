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

  async function registerOrganization(payload: any) {
    console.log('Registering organization with payload:', payload);
  
    try {
      return await fetchWithAuth('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to register organization:', error);
      throw error;
    }
  }

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
