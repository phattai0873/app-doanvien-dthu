import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const landingApi = {
  getConfig: () => api.get('/landing/config'),
  getDocuments: (params) => api.get('/documents', { params }),
  register: (data) => api.post('/users/register', data),
};

export default api;
