import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001',
  withCredentials: true, // This ensures cookies are sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access. Please log in again.');
      // Optionally redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
