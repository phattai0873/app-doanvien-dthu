import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Đính kèm access token vào mỗi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Biến để tránh refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Tự động refresh token khi nhận 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                isRefreshing = false;
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${BASE_URL}/users/refresh-token`, { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = data.data;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                processQueue(null, accessToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ───────────────────────────────────────────────
export const authApi = {
    login: (data) => api.post('/users/login', data),
    logout: () => api.post('/users/logout'),
    getMe: () => api.get('/users/me'),
    updateMe: (formData) => api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    changeMyPassword: (data) => api.patch('/users/me/password', data),
};

// ─── Quản lý tài khoản (Admin) ────────────────────────
export const userMgmtApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users/register', data),
    update: (id, data) => api.put(`/users/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
    toggleLock: (id) => api.patch(`/users/${id}/toggle-lock`),
    toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
    resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
    delete: (id) => api.delete(`/users/${id}`),
};

// ─── Đoàn viên ──────────────────────────────────────────
export const memberApi = {
    getAll: (params) => api.get('/members', { params }),
    getById: (id) => api.get(`/members/${id}`),
    create: (data) => api.post('/members', data),
    update: (id, data) => api.put(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`),
    approve: (id) => api.patch(`/members/${id}/approve`),
    reject: (id) => api.patch(`/members/${id}/reject`),
};

// ─── Liên chi đoàn & Chi đoàn ───────────────────────────
export const branchApi = {
    getAll: () => api.get('/branches'),
    create: (data) => api.post('/branches', data),
    update: (id, data) => api.put(`/branches/${id}`, data),
    delete: (id) => api.delete(`/branches/${id}`),
};

export const cellApi = {
    getAll: (params) => api.get('/cells', { params }),
    create: (data) => api.post('/cells', data),
    update: (id, data) => api.put(`/cells/${id}`, data),
    delete: (id) => api.delete(`/cells/${id}`),
};

// ─── Hoạt động ──────────────────────────────────────────
export const activityApi = {
    getAll: (params) => api.get('/activities', { params }),
    getById: (id) => api.get(`/activities/${id}`),
    create: (data) => api.post('/activities', data),
    update: (id, data) => api.put(`/activities/${id}`, data),
    delete: (id) => api.delete(`/activities/${id}`),
    getMemberAttendance: (memberId) => api.get(`/activities/member/${memberId}/attendance`),
};

// ─── Tin tức ─────────────────────────────────────────────
const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const newsApi = {
    getAll: (params) => api.get('/news', { params }),
    getById: (id) => api.get(`/news/${id}`),
    create: (formData) => api.post('/news', formData, multipartConfig),
    update: (id, formData) => api.put(`/news/${id}`, formData, multipartConfig),
    publish: (id) => api.patch(`/news/${id}/publish`),
    unpublish: (id) => api.patch(`/news/${id}/unpublish`),
    delete: (id) => api.delete(`/news/${id}`),
    uploadEditorImage: (formData) => api.post('/news/upload-image', formData, multipartConfig),
    // Chuyên mục
    getCategories: (params) => api.get('/news/categories', { params }),
    getCategoryById: (id) => api.get(`/news/categories/${id}`),
    createCategory: (data) => api.post('/news/categories', data),
    updateCategory: (id, data) => api.put(`/news/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/news/categories/${id}`),
};

// ─── Thi & Khảo sát ─────────────────────────────────────
export const quizApi = {
    getAll: (params) => api.get('/quiz', { params }),
    getById: (id) => api.get(`/quiz/${id}`),
    create: (formData) => api.post('/quiz', formData, multipartConfig),
    getAttempts: (id, params) => api.get(`/quiz/${id}/attempts`, { params }),
};

// ─── Đoàn phí ───────────────────────────────────────────
export const feeApi = {
    getAll: (params) => api.get('/fees', { params }),
    create: (data) => api.post('/fees', data),
    getUnpaid: (params) => api.get('/fees/unpaid', { params }),
    delete: (id) => api.delete(`/fees/${id}`),
};

// ─── Cuộc họp ───────────────────────────────────────────
export const meetingApi = {
    getAll: (params) => api.get('/meetings', { params }),
    getById: (id) => api.get(`/meetings/${id}`),
    create: (data) => api.post('/meetings', data),
    update: (id, data) => api.put(`/meetings/${id}`, data),
    updateStatus: (id, status) => api.patch(`/meetings/${id}/status`, { status }),
};

// ─── Văn bản ────────────────────────────────────────────
export const documentApi = {
    getAll: (params) => api.get('/documents', { params }),
    getById: (id) => api.get(`/documents/${id}`),
    create: (data) => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/documents/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/documents/${id}`),
    getCategories: () => api.get('/documents/categories'),
};

// ─── Thông báo ───────────────────────────────────────────
export const notificationApi = {
    getAll: (params) => api.get('/notifications', { params }),
    getById: (id) => api.get(`/notifications/${id}`),
    create: (data) => api.post('/notifications', data),
    update: (id, data) => api.put(`/notifications/${id}`, data),
    delete: (id) => api.delete(`/notifications/${id}`),
    send: (id) => api.patch(`/notifications/${id}/send`),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

// ─── Banner ──────────────────────────────────────────────
export const bannerApi = {
    getAll: (params) => api.get('/banners', { params }),
    create: (formData) => api.post('/banners', formData, multipartConfig),
    toggle: (id) => api.patch(`/banners/${id}/toggle`),
    delete: (id) => api.delete(`/banners/${id}`),
};

export const landingApi = {
    getConfigs: () => api.get('/landing/config'),
    updateConfig: (data) => api.put('/landing/config', data),
};

// ─── Địa điểm ──────────────────────────────────────────
export const locationApi = {
    getAll: () => api.get('/locations'),
    create: (data) => api.post('/locations', data),
};

export default api;

