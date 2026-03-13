import { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const volunteerService = {
    // [GET] /api/volunteer-activities
    getActivities: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('volunteer_activities').select('*').order('thoi_gian', { ascending: true });
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.volunteer_activities), SIMULATE_DELAY));
    },

    // [GET] /api/volunteer-activities/{id}
    getActivityDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('volunteer_activities').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.volunteer_activities.find(v => v.id === id)), SIMULATE_DELAY));
    },

    // [POST] /api/activity-registrations
    register: async (activityId, memberId) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('activity_registrations').insert([
                { hoat_dong_id: activityId, dang_vien_id: memberId, trang_thai_dang_ky: 'da_dang_ky' }
            ]);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));
    }
};
