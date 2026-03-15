import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const workService = {
    // [GET] /api/activities/summary or similar
    getWorkSummary: async (params) => {
        if (USE_SUPABASE) {
            const { data: meeting } = await supabase.from('cell_meetings').select('tieu_de, thoi_gian').order('thoi_gian', { ascending: true }).limit(1).single();
            const { data: fees } = await supabase.from('union_fees').select('count', { count: 'exact' }).eq('trang_thai', 'chua_dong');
            return { next_meeting: meeting ? `${meeting.thoi_gian}` : 'Chưa có lịch', unpaid_fee: fees ? `Chưa đóng` : 'Đã hoàn thành' };
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.work_summary), SIMULATE_DELAY));

        // API THỰC
        try {
            const response = await apiClient.get('/api/activities/summary', { params });
            return response.data;
        } catch (e) {
            return { next_meeting: 'Chưa có lịch', unpaid_fee: 'Đã hoàn thành' };
        }
    },

    refreshCheckinCode: async (id) => {
        if (USE_MOCK_API) return { success: true, data: { checkinCode: 'ACT123', checkinCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000) } };
        return await apiClient.post(`/api/activities/${id}/refresh-code`);
    }
};

