import { create } from 'zustand';
import axios from 'axios';
import apiUrl from '../config';


const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')),

  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  validateSession: async () => {
    try {
      const response = await axios.get(`${apiUrl}/auth/validate`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      set({ user: response.data.user });
      return true;
    } catch {
      set({ token: null, user: null });
      localStorage.clear();
      return false;
    }
  }
}));

export default useAuthStore;