import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase, getCurrentSession } from './supabaseClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await supabase.auth.refreshSession();
        // Retry original request
        return api.request(error.config!);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login handled in navigation
      }
    }
    return Promise.reject(error);
  }
);

export default api;
