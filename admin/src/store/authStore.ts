import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  userId: number;
  email: string;
  username: string;
  isStaff: boolean;
  isSuperuser: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  checkAuth: () => boolean;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);

      if (response.success) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);

        set({
          user: response.user,
          isAuthenticated: true,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await api.getCurrentUser();
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },
}));
