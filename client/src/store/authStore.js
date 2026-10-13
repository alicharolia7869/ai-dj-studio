import { create } from 'zustand';
import { api } from '../services/api.js';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('aidj_user') || 'null'),
  token: localStorage.getItem('aidj_access_token') || null,
  isAuthenticated: !!localStorage.getItem('aidj_access_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.login(email, password);
      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        loading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await api.register(userData);
      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        loading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (_) {}
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.getMe();
      if (res.data?.user) {
        set({ user: res.data.user, isAuthenticated: true });
        localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
      }
    } catch (_) {
      // If failed, token might be invalid
      api.clearTokens();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  updatePreferences: async (preferences) => {
    try {
      const res = await api.updatePreferences(preferences);
      if (res.data?.preferences && get().user) {
        const updated = { ...get().user, musicPreferences: res.data.preferences };
        set({ user: updated });
        localStorage.setItem('aidj_user', JSON.stringify(updated));
      }
      return res;
    } catch (err) {
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      if (res.data?.user) {
        set({ user: res.data.user });
        localStorage.setItem('aidj_user', JSON.stringify(res.data.user));
      }
      return res;
    } catch (err) {
      throw err;
    }
  }
}));

// Listen for global logout events (e.g. from token refresh failure)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
