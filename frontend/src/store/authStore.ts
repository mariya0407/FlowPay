import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId: number;
  managerId: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, tokenStr: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Try to rehydrate from localStorage strictly on the client side
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('flowpay_user') : null;
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flowpay_token') : null;

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    
    login: (userData, tokenStr) => {
      localStorage.setItem('flowpay_user', JSON.stringify(userData));
      localStorage.setItem('flowpay_token', tokenStr);
      set({ user: userData, token: tokenStr, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('flowpay_user');
      localStorage.removeItem('flowpay_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  };
});
