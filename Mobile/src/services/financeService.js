import { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const financeService = {
    // [GET] /api/party-fees -> union_fees
    getFees: async (memberId) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('union_fees').select('*').eq('dang_vien_id', memberId);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.party_fees), SIMULATE_DELAY));
    },

    // [POST] /api/party-fees/pay
    payFee: async (feeId, proofUrl) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('union_fees').update({
                trang_thai: 'da_dong',
                minh_chung_anh: proofUrl,
                paid_at: new Date().toISOString()
            }).eq('id', feeId);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));
    }
};
