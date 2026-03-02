import axios, { AxiosError, AxiosInstance } from 'axios';
import { getCurrentSession, safeRefreshSession } from './supabaseClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45s to handle Render free tier cold starts (~30-50s)
});

// Add JWT token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getCurrentSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Error getting session for API request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Only retry once — prevent infinite 401 → refresh → retry → 401 loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('API: 401 detected, attempting safe refresh...');
        const data = await safeRefreshSession();
        if (data.session?.access_token) {
          // Update the token on the retried request
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
          return api.request(originalRequest);
        }
      } catch (refreshError: any) {
        console.error('API: Token refresh failed:', refreshError.message || refreshError);
      }

      // Refresh failed or no new token — the safeRefreshSession might have already called signOut
      // but we ensure the UI redirects here if it hasn't already.
      console.warn('API: Session expired or invalid, cleaning up...');
      try {
        const { router } = await import('expo-router');
        router.replace('/(auth)/login');
      } catch (e) {
        console.error('API: Failed to redirect to login:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
