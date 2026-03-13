import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const notificationService = {
    // [GET] /api/notifications
    getNotifications: async (params) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.notifications), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/notifications', { params });
        return response.data || [];
    },

    // [GET] /api/notifications/{id}
    getNotificationDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('notifications').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.notifications.find(n => n.id === id)), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/notifications/${id}`);
        return response.data;
    }
};

