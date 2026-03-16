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
  getNews: (params) => api.get('/news', { params }),
  getNewsById: (id) => api.get(`/news/${id}`),
  getNewsCategories: () => api.get('/news/categories'),
  getBanners: () => api.get('/banners', { params: { activeOnly: 'true' } }),
  register: (data) => api.post('/users/register', data),
};

export default api;
