import apiClient, { USE_MOCK_API, USE_SUPABASE, setAuthTokens, loadAuthToken } from './api';
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
            await setAuthTokens(data.session?.access_token);
            return { token: data.session?.access_token, user: data.user, role: 'user' };
        }

        if (USE_MOCK_API) {
            await setAuthTokens('mock-token', 'mock-refresh-token');
            return new Promise(r => setTimeout(() => r({ success: true, token: 'mock-token', role: username === 'admin' ? 'admin' : 'user' }), 1000));
        }

        // --- GỌI API THỰC ---
        try {
            const response = await apiClient.post('/api/users/login', { username, password });
            // response là response.data do interceptor: { success: true, data: { accessToken, refreshToken, id, username, Roles, UnionMember } }
            const { accessToken, refreshToken, id, Roles, UnionMember } = response.data;
            
            // Lưu cả 2 token
            await setAuthTokens(accessToken, refreshToken);

            let role = 'user';
            if (Roles && Array.isArray(Roles) && Roles.length > 0) {
                role = Roles[0].code || Roles[0].name || 'user';
            }

            return {
                token: accessToken,
                user: { ...response.data, role },
                role
            };
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        if (USE_SUPABASE || USE_MOCK_API) {
            await setAuthTokens(null, null);
            return true;
        }

        try {
            await apiClient.post('/api/users/logout');
            await setAuthTokens(null, null);
            return true;
        } catch (error) {
            await setAuthTokens(null, null);
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
            return response; // response là response.data từ interceptor (đã chứa {success, data})
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
            // response.data chứa User + Roles + UnionMember (đã include Cell & Branch)
            const userData = response.data;
            
            let role = 'user';
            if (userData.Roles && userData.Roles.length > 0) {
                role = userData.Roles[0].code;
            }

            return {
                ...userData,
                role
            };
        } catch (error) {
            console.log('GetCurrentUser error:', error.message);
            return null;
        }
    },

    deleteAccount: async () => {
        if (USE_SUPABASE || USE_MOCK_API) {
            await setAuthTokens(null, null);
            return { success: true };
        }

        try {
            const response = await apiClient.delete('/api/users/me');
            await setAuthTokens(null, null);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
