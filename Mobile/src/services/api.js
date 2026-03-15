import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CỜ CẤU HÌNH: 
// 🔧 DEV MODE: Tắt kết nối backend thực, dùng dữ liệu giả để xem UI
export const USE_MOCK_API = false;  // ← Đổi lại false khi cần kết nối backend thực
export const USE_SUPABASE = false;

const TOKEN_KEY = 'auth_token';

// Base URL của API - Thay đổi theo môi trường
// Android Emulator dùng 10.0.2.2 để gọi localhost máy tính
// iOS Emulator hoặc thiết bị thực dùng localhost/IP
// Dùng IP máy tính của bạn để thiết bị thực (Expo Go) có thể kết nối được
const DEV_HOST = '192.168.1.4'; 
export const API_BASE_URL = `http://${DEV_HOST}:5000`;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Lưu token bền vững vào AsyncStorage
export const setAuthToken = async (token) => {
    if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
        delete apiClient.defaults.headers.common['Authorization'];
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

// Response interceptor - Trả về data trực tiếp
apiClient.interceptors.response.use(
    (response) => {
        // Backend trả về { success, data, ... } hoặc { success, user, ... }
        return response.data;
    },
    (error) => {
        const message = error.response?.data?.message || error.message || 'Lỗi kết nối server';
        console.error('API Error:', message);
        return Promise.reject({ ...error.response?.data, message });
    }
);

export default apiClient;
