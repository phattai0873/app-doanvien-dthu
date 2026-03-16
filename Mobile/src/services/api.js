import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CỜ CẤU HÌNH: 
// 🔧 DEV MODE: Tắt kết nối backend thực, dùng dữ liệu giả để xem UI
export const USE_MOCK_API = false;  // ← Đổi lại false khi cần kết nối backend thực
export const USE_SUPABASE = false;

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Base URL của API - Thay đổi theo môi trường
// Android Emulator dùng 10.0.2.2 để gọi localhost máy tính
// iOS Emulator hoặc thiết bị thực dùng localhost/IP
// Dùng IP máy tính của bạn để thiết bị thực (Expo Go) có thể kết nối được
const DEV_HOST = '172.16.231.2'; // Đổi lại 10.0.2.2 khi dùng Android Emulator
export const API_BASE_URL = `http://${DEV_HOST}:5000`;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Lưu token bền vững vào AsyncStorage
export const setAuthTokens = async (accessToken, refreshToken) => {
    try {
        if (accessToken) {
            await AsyncStorage.setItem(TOKEN_KEY, accessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            if (refreshToken) {
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            }
        } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
            delete apiClient.defaults.headers.common['Authorization'];
        }
    } catch (e) {
        console.error('Error saving tokens:', e);
    }
};

// Lấy token từ AsyncStorage và gắn vào header khi khởi động app
export const loadAuthToken = async () => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return token;
    } catch (e) {
        return null;
    }
};

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Backend chuẩn: { success: true, data: ..., message: ... }
        if (response.data && response.data.success === false) {
            return Promise.reject({
                message: response.data.message || 'Lỗi từ server',
                ...response.data
            });
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Xử lý Auto Refresh Token khi gặp lỗi 401
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
                if (refreshToken) {
                    // Gọi endpoint refresh token (chú ý: không dùng apiClient để tránh loop interceptor nếu lỗi tiếp)
                    const refreshRes = await axios.post(`${API_BASE_URL}/api/users/refresh-token`, { refreshToken });
                    if (refreshRes.data && refreshRes.data.success) {
                        const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
                        await setAuthTokens(accessToken, newRefreshToken);
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                        return apiClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh token hết hạn hoặc lỗi -> Logout
                await setAuthTokens(null, null);
                // Có thể bắn event hoặc dùng context để redirect về Login
                return Promise.reject(refreshError);
            }
        }

        const message = error.response?.data?.message || error.message || 'Lỗi kết nối server';
        console.error('API Error:', message);
        return Promise.reject({ ...error.response?.data, message });
    }
);

export default apiClient;
