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
    restore: (id) => api.patch(`/users/${id}/restore`),
    forceDelete: (id) => api.delete(`/users/${id}/force`),
};

// ─── Đoàn viên ──────────────────────────────────────────
export const memberApi = {
    getAll: (params) => api.get('/members', { params }),
    getById: (id) => api.get(`/members/${id}`),
    create: (data) => api.post('/members', data),
    update: (id, data) => api.put(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`),
    restore: (id) => api.patch(`/members/${id}/restore`),
    forceDelete: (id) => api.delete(`/members/${id}/force`),
    approve: (id) => api.patch(`/members/${id}/approve`),
    reject: (id) => api.patch(`/members/${id}/reject`),
    assignPosition: (id, data) => api.post(`/members/${id}/positions`, data),
    getBranches: () => api.get('/branches', { params: { limit: 100 } }),
    getCells: (branchId) => api.get('/cells', { params: { unionBranchId: branchId, limit: 100 } }),
};

export const positionApi = {
    getAll: () => api.get('/positions'),
};

// ─── Liên chi đoàn & Chi đoàn ───────────────────────────
export const branchApi = {
    getAll: (params) => api.get('/branches', { params }),
    create: (data) => api.post('/branches', data),
    update: (id, data) => api.put(`/branches/${id}`, data),
    delete: (id) => api.delete(`/branches/${id}`),
    restore: (id) => api.patch(`/branches/${id}/restore`),
    forceDelete: (id) => api.delete(`/branches/${id}/force`),
};

export const cellApi = {
    getAll: (params) => api.get('/cells', { params }),
    create: (data) => api.post('/cells', data),
    update: (id, data) => api.put(`/cells/${id}`, data),
    delete: (id) => api.delete(`/cells/${id}`),
    restore: (id) => api.patch(`/cells/${id}/restore`),
    forceDelete: (id) => api.delete(`/cells/${id}/force`),
};

// ─── Hoạt động ──────────────────────────────────────────
export const activityApi = {
    getAll: (params) => api.get('/activities', { params }),
    getById: (id) => api.get(`/activities/${id}`),
    create: (data) => api.post('/activities', data),
    update: (id, data) => api.put(`/activities/${id}`, data),
    delete: (id) => api.delete(`/activities/${id}`),
    restore: (id) => api.patch(`/activities/${id}/restore`),
    forceDelete: (id) => api.delete(`/activities/${id}/force`),
    approve: (id) => api.patch(`/activities/${id}/approve`),
    register: (id) => api.post(`/activities/${id}/register`),
    updateParticipant: (id, memberId, data) => api.patch(`/activities/${id}/participants/${memberId}`, data),
    getMemberAttendance: (memberId) => api.get(`/activities/member/${memberId}/attendance`),
    checkIn: (id, data) => api.post(`/activities/${id}/check-in`, data),
    refreshCode: (id, data) => api.post(`/activities/${id}/refresh-code`, data),
    getBranches: () => api.get('/branches', { params: { limit: 100 } }),
    getCells: (branchId) => api.get('/cells', { params: { unionBranchId: branchId, limit: 100 } }),
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
    restore: (id) => api.patch(`/news/${id}/restore`),
    forceDelete: (id) => api.delete(`/news/${id}/force`),
    uploadEditorImage: (formData) => api.post('/news/upload-image', formData, multipartConfig),
    // Chuyên mục
    getCategories: (params) => api.get('/news/categories', { params }),
    getCategoryById: (id) => api.get(`/news/categories/${id}`),
    createCategory: (data) => api.post('/news/categories', data),
    updateCategory: (id, data) => api.put(`/news/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/news/categories/${id}`),
    restoreCategory: (id) => api.patch(`/news/categories/${id}/restore`),
    forceDeleteCategory: (id) => api.delete(`/news/categories/${id}/force`),
};

// ─── Thi & Khảo sát ─────────────────────────────────────
export const quizApi = {
    getAll: (params) => api.get('/quiz', { params }),
    getById: (id) => api.get(`/quiz/${id}`),
    create: (formData) => api.post('/quiz', formData, multipartConfig),
    update: (id, formData) => api.put(`/quiz/${id}`, formData, multipartConfig),
    delete: (id) => api.delete(`/quiz/${id}`),
    restore: (id) => api.patch(`/quiz/${id}/restore`),
    forceDelete: (id) => api.delete(`/quiz/${id}/force`),
    getAttempts: (id, params) => api.get(`/quiz/${id}/attempts`, { params }),
};

// ─── Đoàn phí ───────────────────────────────────────────
export const feeApi = {
    getAll: (params) => api.get('/fees', { params }),
    create: (data) => api.post('/fees', data),
    getUnpaid: (params) => api.get('/fees/unpaid', { params }),
    update: (id, data) => api.put(`/fees/${id}`, data),
    delete: (id) => api.delete(`/fees/${id}`),
    // Phê duyệt & Giao dịch
    getPending: (params) => api.get('/fees/pending', { params }),
    approve: (id) => api.post(`/fees/approve/${id}`),
    reject: (id, reason) => api.post(`/fees/reject/${id}`, { reason }),
    // Ngân hàng
    getBankSetting: () => api.get('/fees/bank-setting'),
    updateBankSetting: (data) => api.put('/fees/bank-setting', data),
};

export const feeTypeApi = {
    getAll: (params) => api.get('/fee-types', { params }),
    getById: (id) => api.get(`/fee-types/${id}`),
    create: (data) => api.post('/fee-types', data),
    update: (id, data) => api.put(`/fee-types/${id}`, data),
    delete: (id) => api.delete(`/fee-types/${id}`),
};

// ─── Cuộc họp ───────────────────────────────────────────
export const meetingApi = {
    getAll: (params) => api.get('/meetings', { params }),
    getById: (id) => api.get(`/meetings/${id}`),
    create: (data) => api.post('/meetings', data),
    update: (id, data) => api.put(`/meetings/${id}`, data),
    delete: (id) => api.delete(`/meetings/${id}`),
    restore: (id) => api.patch(`/meetings/${id}/restore`),
    forceDelete: (id) => api.delete(`/meetings/${id}/force`),
    updateStatus: (id, status) => api.patch(`/meetings/${id}/status`, { status }),
    getAttendance: (id) => api.get(`/meetings/${id}/attendance`),
    checkIn: (id, data) => api.post(`/meetings/${id}/check-in`, data),
    refreshCode: (id, data) => api.post(`/meetings/${id}/refresh-code`, data),
};

// ─── Văn bản ────────────────────────────────────────────
export const documentApi = {
    getAll: (params) => api.get('/documents', { params }),
    getById: (id) => api.get(`/documents/${id}`),
    create: (data) => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/documents/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/documents/${id}`),
    restore: (id) => api.patch(`/documents/${id}/restore`),
    forceDelete: (id) => api.delete(`/documents/${id}/force`),
    toggleStatus: (id) => api.patch(`/documents/${id}/toggle-status`),
    // Chuyên mục
    getCategories: () => api.get('/documents/categories'),
    createCategory: (data) => api.post('/documents/categories', data),
    updateCategory: (id, data) => api.put(`/documents/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/documents/categories/${id}`),
    restoreCategory: (id) => api.patch(`/documents/categories/${id}/restore`),
    forceDeleteCategory: (id) => api.delete(`/documents/categories/${id}/force`),
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
    getBranches: () => api.get('/branches', { params: { limit: 100 } }),
    getCells: (branchId) => api.get('/cells', { params: { unionBranchId: branchId, limit: 100 } }),
};

// ─── Banner ──────────────────────────────────────────────
export const bannerApi = {
    getAll: (params) => api.get('/banners', { params }),
    create: (formData) => api.post('/banners', formData, multipartConfig),
    toggle: (id) => api.patch(`/banners/${id}/toggle`),
    delete: (id) => api.delete(`/banners/${id}`),
    restore: (id) => api.patch(`/banners/${id}/restore`),
    forceDelete: (id) => api.delete(`/banners/${id}/force`),
};

export const landingApi = {
    getConfigs: () => api.get('/landing/config'),
    updateConfig: (data) => api.put('/landing/config', data),
};

// ─── Địa điểm ──────────────────────────────────────────
export const locationApi = {
    getAll: () => api.get('/locations'),
    create: (data) => api.post('/locations', data),
    update: (id, data) => api.put(`/locations/${id}`, data),
    delete: (id) => api.delete(`/locations/${id}`),
};

export default api;

