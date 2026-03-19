import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const financeService = {
    // [GET] /api/fees
    getFees: async (params = {}) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('union_fees').select('*').eq('dang_vien_id', params.memberId);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.party_fees), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/fees', { params });
        return response.data || [];
    },

    // [POST] /api/fees
    payFee: async (formData) => {
        if (USE_SUPABASE) {
            // ... existing supabase logic if needed
            return null;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));
 
        // API THỰC
        const response = await apiClient.post('/api/fees', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
