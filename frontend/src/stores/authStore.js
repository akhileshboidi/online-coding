import { create } from 'zustand';
import axios from 'axios';
import Cookies from 'js-cookie';

const useAuthStore = create(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,
      isAuthenticated: false,

      // API base URL
      API_BASE_URL: 'http://localhost:3000/api',

      // Set loading state
      setLoading: (loading) => set({ loading }),

      // Login function
      login: async (email, password) => {
        try {
          set({ loading: true });
          const response = await axios.post(`${get().API_BASE_URL}/auth/login`, {
            email,
            password
          });

          // Store JWT token in cookie
          Cookies.set('jwt', response.data.token, {
            expires: 7, // 7 days
            secure: false, // Set to true in production with HTTPS
            sameSite: 'strict'
          });

          // Store token and user data in state
          set({
            token: response.data.token,
            user: response.data.user,
            isAuthenticated: true,
            loading: false
          });

          return { success: true };
        } catch (error) {
          set({ loading: false });
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          return { success: false, error: errorMessage };
        }
      },

      // Signup function
      signup: async (userData) => {
        try {
          set({ loading: true });
          const response = await axios.post(`${get().API_BASE_URL}/auth/signup`, userData);

          // Store JWT token in cookie
          Cookies.set('jwt', response.data.token, {
            expires: 7, // 7 days
            secure: false, // Set to true in production with HTTPS
            sameSite: 'strict'
          });

          // Store token and user data in state
          set({
            token: response.data.token,
            user: response.data.user,
            isAuthenticated: true,
            loading: false
          });

          return { success: true };
        } catch (error) {
          set({ loading: false });
          const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
          return { success: false, error: errorMessage };
        }
      },

      // Logout function
      logout: async () => {
        try {
          // Call server logout endpoint if needed for future token blacklisting
          if (get().token) {
            await axios.post(`${get().API_BASE_URL}/auth/logout`, {}, {
              headers: get().getAuthHeaders()
            });
          }
        } catch (error) {
          // Ignore logout errors as user is logging out anyway
          console.log('Logout error:', error);
        } finally {
          // Clear JWT cookie
          Cookies.remove('jwt');

          // Clear all auth data
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
          });
        }
      },

      // Check authentication on app load
      checkAuth: async () => {
        const token = Cookies.get('jwt');
        if (!token) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await axios.get(`${get().API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          set({
            token: token,
            user: response.data.user,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          // Token invalid, clear auth state and cookie
          Cookies.remove('jwt');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
          });
        }
      },

      // Get auth headers for API calls
      getAuthHeaders: () => {
        const token = Cookies.get('jwt') || get().token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      // Update user profile
      updateProfile: async (profileData) => {
        try {
          const response = await axios.put(`${get().API_BASE_URL}/auth/profile`, profileData, {
            headers: get().getAuthHeaders()
          });

          set({ user: response.data.user });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Update failed';
          return { success: false, error: errorMessage };
        }
      }
    })
);

export default useAuthStore;