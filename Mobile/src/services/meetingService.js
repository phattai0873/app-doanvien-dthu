import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const meetingService = {
    // [GET] /api/meetings
    getMeetings: async (params) => {
        if (USE_SUPABASE) {
            const query = supabase.from('cell_meetings').select('*');
            if (params?.cellId) query.eq('chi_bo_id', params.cellId);
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.cell_meetings), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/meetings', { params });
        return response.data || [];
    },

    // [GET] /api/meetings/{id}
    getMeetingDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('cell_meetings').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.cell_meetings.find(m => m.id === id)), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/meetings/${id}`);
        return response.data;
    },

    // [POST] /api/meetings/attendance
    submitAttendance: async (data) => {
        if (USE_SUPABASE) {
            const { error } = await supabase.from('meeting_attendance').insert([data]);
            if (error) throw error;
            return { success: true };
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));

        // API THỰC
        return await apiClient.post('/api/meetings/attendance', data);
    },

    getLocations: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('meeting_locations').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r([{ id: 1, name: "Hội trường A" }]), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/meetings/locations');
        return response.data || [];
    }
};

