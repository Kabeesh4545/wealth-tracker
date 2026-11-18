import axios from 'axios';

const getBaseURL = () => {
  // In production builds and SPA serving, ALWAYS use relative root ('') so requests
  // automatically target the current origin (Cloudflare tunnel, local Wi-Fi IP, or localhost).
  // This prevents mobile devices from erroneously trying to reach 'localhost:8000' on the phone.
  if (import.meta.env.PROD) {
    return '';
  }
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Only dispatch session expiry for authenticated API endpoints, not login/register
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        localStorage.removeItem('token');
        // Dispatch custom event to notify React app of auth expiration
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
