import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from './config';

// Create axios instance with dynamic API URL
const api = axios.create({
  baseURL: getApiUrl(),
  // Increase timeout to accommodate AI generation latency
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: true, // Set to true if backend requires credentials
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors (CORS, connection refused, etc.)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. The AI may still be processing, please try again shortly.');
        return Promise.reject(error);
      }
      
      // Check for CORS errors
      if (error.message && (
        error.message.includes('CORS') || 
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch')
      )) {
        const apiUrl = getApiUrl();
        console.error('🌐 CORS/Network Error:', {
          message: error.message,
          apiUrl,
          currentOrigin: window.location.origin,
        });
        toast.error('Connection error. Please check if the backend server is running and CORS is configured correctly.');
        return Promise.reject(error);
      }
      
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'An error occurred';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const cropPlanAPI = {
  generate: (planData) => {
    // Check if planData is FormData (for file uploads)
    if (planData instanceof FormData) {
      return api.post('/cropplan/generate', planData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Regular JSON data
    return api.post('/cropplan/generate', planData);
  },
  followUp: (followUpData) => api.post('/cropplan/followup', followUpData),
  getPlan: (id) => api.get(`/cropplan/${id}`),
  getPlans: (params) => api.get('/cropplan', { params }),
  deletePlan: (id) => api.delete(`/cropplan/${id}`),
  getStats: () => api.get('/cropplan/stats/summary'),
};

export const diagnosisAPI = {
  upload: (formData) => api.post('/diagnosis/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getById: (id) => api.get(`/diagnosis/${id}`),
  getDiagnosis: (id) => api.get(`/diagnosis/${id}`),
  getDiagnoses: (params) => api.get('/diagnosis', { params }),
  deleteDiagnosis: (id) => api.delete(`/diagnosis/${id}`),
  getStats: () => api.get('/diagnosis/stats/summary'),
  getDiseases: () => api.get('/diagnosis/diseases/list'),
  followUp: (followUpData) => api.post('/diagnosis/followup', followUpData),
};

export const historyAPI = {
  getHistory: (params) => api.get('/history/get', { params }),
  deleteItem: (type, id) => api.delete(`/history/delete/${type}/${id}`),
  clearHistory: (type) => api.delete('/history/clear', { data: { type } }),
  getStats: () => api.get('/history/stats'),
};

// Utility functions
export const handleApiError = (error) => {
  console.error('API Error:', error);
  const message = error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
  return message;
};

export const handleApiSuccess = (message) => {
  toast.success(message);
};

export default api;
