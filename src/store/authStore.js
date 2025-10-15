import { create } from 'zustand';
import axios from 'axios';
import apiUrl from '../config';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';


let logoutTimer;

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')),

  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });

    // Limpiar cualquier timer anterior
    if (logoutTimer) clearTimeout(logoutTimer);

    try {
      const decoded = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded.exp;
      const timeLeftMs = (exp - now) * 1000;

      if (timeLeftMs > 0) {
        logoutTimer = setTimeout(async () => {
          // Mostrar alerta antes de cerrar sesión
          await Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            icon: 'info',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          useAuthStore.getState().logout();
          window.location.href = '/login';
        }, timeLeftMs);
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error decodificando token:', err);
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
    if (logoutTimer) clearTimeout(logoutTimer);
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