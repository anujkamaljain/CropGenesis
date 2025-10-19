import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Increase timeout to accommodate AI generation latency
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
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
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. The AI may still be processing, please try again shortly.');
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
  generate: (planData) => api.post('/cropplan/generate', planData),
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
  getDiagnosis: (id) => api.get(`/diagnosis/${id}`),
  getDiagnoses: (params) => api.get('/diagnosis', { params }),
  deleteDiagnosis: (id) => api.delete(`/diagnosis/${id}`),
  getStats: () => api.get('/diagnosis/stats/summary'),
  getDiseases: () => api.get('/diagnosis/diseases/list'),
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
