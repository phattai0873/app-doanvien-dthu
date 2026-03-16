import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const examService = {
    // [GET] /api/exams
    getExams: async (params = {}) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_exams').select('*').eq('is_active', true);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.exams), SIMULATE_DELAY));
        
        const res = await apiClient.get('/api/quiz', { params });
        return res;
    },

    // [GET] /api/quiz/{id}
    getExamDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_exams').select('*, quiz_questions(*, quiz_options(*))').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.exams.find(e => e.id === id)), SIMULATE_DELAY));
        
        const res = await apiClient.get(`/api/quiz/${id}`);
        return res;
    },

    // [POST] /api/quiz-attempts
    submitAttempt: async (id, attemptData) => {
        const res = await apiClient.post(`/quiz/exams/${id}/submit`, attemptData);
        return res;
    },

    // [GET] /api/quiz-attempts/by-member/{id}
    getMyAttempts: async (examId) => {
        const res = await apiClient.get(`/quiz/exams/${examId}/attempts`);
        return res;
    }
};
