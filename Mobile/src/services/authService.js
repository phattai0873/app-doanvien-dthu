import apiClient, { USE_MOCK_API, USE_SUPABASE, setAuthToken, loadAuthToken } from './api';
import { supabase } from './supabaseClient';

/**
 * Auth Service - Kết nối với API thực hoặc Supabase/Mock
 */
export const authService = {
    login: async (username, password) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username, 
                password: password,
            });
            if (error) throw error;
            setAuthToken(data.session?.access_token);
            return { token: data.session?.access_token, user: data.user, role: 'user' };
        }

        if (USE_MOCK_API) {
            setAuthToken('mock-token');
            return new Promise(r => setTimeout(() => r({ success: true, token: 'mock-token', role: username === 'admin' ? 'admin' : 'user' }), 1000));
        }

        // --- GỌI API THỰC ---
        try {
            const response = await apiClient.post('/api/users/login', { username, password });
            // response là response.data do interceptor. { success: true, data: { accessToken, id, username } }
            const { accessToken, id } = response.data;
            
            // Lưu token vào AsyncStorage (bền vững qua các lần restart) - hàm async
            await setAuthToken(accessToken);

            // Lấy thông tin Role từ API /me ngay sau khi đăng nhập
            let role = 'user';
            try {
                const meResponse = await apiClient.get('/api/users/me');
                const meData = meResponse.data || meResponse;
                if (meData.Roles && Array.isArray(meData.Roles) && meData.Roles.length > 0) {
                    role = meData.Roles[0].code || meData.Roles[0].name || 'user';
                }
            } catch (meError) {
                console.log('Could not fetch user roles:', meError.message);
            }

            return {
                token: accessToken,
                user: { id, username },
                role
            };
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        if (USE_SUPABASE) {
            await supabase.auth.signOut();
            setAuthToken(null);
            return true;
        }

        if (USE_MOCK_API) {
            setAuthToken(null);
            return true;
        }

        try {
            await apiClient.post('/api/users/logout');
            setAuthToken(null);
            return true;
        } catch (error) {
            setAuthToken(null);
            return true; 
        }
    },

    register: async (userData) => {
        if (USE_SUPABASE) {
            // Not fully implemented for supabase
            return null;
        }

        if (USE_MOCK_API) {
            return new Promise(r => setTimeout(() => r({ success: true }), 1000));
        }

        try {
            const response = await apiClient.post('/api/users/register', userData);
            return response.data; // should contain { success, data }
        } catch (error) {
            throw error;
        }
    },

    getCurrentUser: async () => {
        if (USE_SUPABASE) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Fetch profile for role
            const { data: profile } = await supabase
                .from('profiles')
                .select('vai_tro, dang_vien_id')
                .eq('id', user.id)
                .single();

            return { ...user, role: profile?.vai_tro || 'user', dang_vien_id: profile?.dang_vien_id };
        }
        if (USE_MOCK_API) {
            return { id: 1, email: "user@example.com", fullName: "Nguyễn Văn A", role: "user" };
        }

        // --- GỌI API THỰC ---
        try {
            // Bước quan trọng: nạp token từ AsyncStorage vào header trước
            const token = await loadAuthToken();
            if (!token) return null; // Chưa đăng nhập

            const response = await apiClient.get('/api/users/me');
            // response đã được interceptor unwrap thành response.data = { success, data }
            const userData = response.data || response;
            return userData;
        } catch (error) {
            console.log('GetCurrentUser error:', error.message);
            return null;
        }
    }
};
