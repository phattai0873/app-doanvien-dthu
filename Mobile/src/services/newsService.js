import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const newsService = {
    // [GET] /api/news-categories
    getCategories: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('news_categories').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.news_categories), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/news/categories'); // Note: adjust if your route is different
        return response.data || [];
    },

    // [GET] /api/news
    getNews: async (categoryId = 'all', scope = null) => {
        if (USE_SUPABASE) {
            const query = supabase.from('news').select('*').eq('status', 1);
            if (categoryId !== 'all') query.eq('category_id', categoryId);
            if (scope) query.eq('scope', scope);
            const { data, error } = await query.order('published_at', { ascending: false });
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) {
            return new Promise(r => {
                setTimeout(() => {
                    let data = categoryId === 'all' ? MOCK_DB.news : MOCK_DB.news.filter(n => n.categoryId === categoryId);
                    if (scope) data = data.filter(n => n.scope === scope);
                    r(data);
                }, SIMULATE_DELAY);
            });
        }

        // API THỰC
        const params = {};
        if (categoryId !== 'all') params.categoryId = categoryId;
        if (scope) params.scope = scope;
        
        const response = await apiClient.get('/api/news', { params });
        // Backend trả về { success, data: [], pagination }
        return response.data || [];
    },

    // [GET] /api/news/{id}
    getNewsDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.news.find(n => n.id === id)), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/news/${id}`);
        return response.data;
    },

    deleteNews: async (id) => {
        return await apiClient.delete(`/api/news/${id}`);
    },

    createNews: async (data) => {
        return await apiClient.post('/api/news', data);
    },

    updateNews: async (id, data) => {
        return await apiClient.put(`/api/news/${id}`, data);
    },

    publishNews: async (id) => {
        return await apiClient.patch(`/api/news/${id}/publish`);
    },

    unpublishNews: async (id) => {
        return await apiClient.patch(`/api/news/${id}/unpublish`);
    }
};

