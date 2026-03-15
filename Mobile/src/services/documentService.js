import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const documentService = {
    // [GET] /api/documents/categories
    getDocumentCategories: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('document_categories').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.document_categories), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/documents/categories');
        return response.data || [];
    },

    // [GET] /api/documents
    getDocuments: async (categoryId = 'all') => {
        if (USE_SUPABASE) {
            const query = supabase.from('documents').select('*');
            if (categoryId !== 'all') query.eq('category_id', categoryId);
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) {
            return new Promise(r => {
                setTimeout(() => {
                    const data = categoryId === 'all' ? MOCK_DB.documents : MOCK_DB.documents.filter(d => d.category_id === categoryId);
                    r(data);
                }, SIMULATE_DELAY);
            });
        }

        // API THỰC
        const params = { status: 'PUBLISH' };
        if (categoryId !== 'all') params.categoryId = categoryId;
        const response = await apiClient.get('/api/documents', { params });
        // Backend returns { success, data, pagination }
        return response.data || [];
    },

    // [GET] /api/documents/{id}
    getDocumentDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.documents.find(d => d.id === id)), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/documents/${id}`);
        return response.data;
    }
};

