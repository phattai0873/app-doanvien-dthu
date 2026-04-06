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
    payFee: async (feeData) => {
        if (USE_SUPABASE) {
            // ... existing supabase logic if needed
            return null;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.post('/api/fees', feeData);
        return response.data;
    },
    // [PUT] /api/fees/:id
    updateFee: async (id, data) => {
        const response = await apiClient.put(`/api/fees/${id}`, data);
        return response.data;
    },
    // [DELETE] /api/fees/:id
    deleteFee: async (id) => {
        const response = await apiClient.delete(`/api/fees/${id}`);
        return response.data;
    },
    // [GET] /api/fees/unpaid
    getUnpaidMembers: async (params = {}) => {
        const response = await apiClient.get('/api/fees/unpaid', { params });
        return response.data || response;
    },
    // [GET] /api/fee-types
    getFeeTypes: async (params = {}) => {
        const response = await apiClient.get('/api/fee-types', { params });
        return response.data || [];
    },
    // [POST] /api/fee-types
    createFeeType: async (data) => {
        const response = await apiClient.post('/api/fee-types', data);
        return response.data;
    },
    // [PUT] /api/fee-types/:id
    updateFeeType: async (id, data) => {
        const response = await apiClient.put(`/api/fee-types/${id}`, data);
        return response.data;
    },
    // [DELETE] /api/fee-types/:id
    deleteFeeType: async (id) => {
        const response = await apiClient.delete(`/api/fee-types/${id}`);
        return response.data;
    },
    // [GET] /api/fees/my-dashboard
    getMyFeeDashboard: async () => {
        const response = await apiClient.get('/api/fees/my-dashboard');
        return response.data?.data || response.data || null;
    },
    // [POST] /api/fees/init-payment
    initPayment: async (formData) => {
        const response = await apiClient.post('/api/fees/init-payment', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    // [GET] /api/fees/pending
    getPendingTransactions: async () => {
        const response = await apiClient.get('/api/fees/pending');
        return response.data?.data || [];
    },
    // [POST] /api/fees/approve/:id
    approveTransaction: async (id) => {
        const response = await apiClient.post(`/api/fees/approve/${id}`);
        return response.data;
    },
    // [POST] /api/fees/reject/:id
    rejectTransaction: async (id, reason) => {
        const response = await apiClient.post(`/api/fees/reject/${id}`, { reason });
        return response.data;
    },
    // [GET] /api/fees/bank-setting
    getBankSetting: async () => {
        const response = await apiClient.get('/api/fees/bank-setting');
        return response.data?.data || null;
    },
    // [PUT] /api/fees/bank-setting
    updateBankSetting: async (data) => {
        const response = await apiClient.put('/api/fees/bank-setting', data);
        return response.data;
    }
};
