import { USE_MOCK_API, USE_SUPABASE } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const examService = {
    // [GET] /api/exams
    getExams: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_exams').select('*').eq('is_active', true);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.exams), SIMULATE_DELAY));
    },

    // [GET] /api/exams/{id}
    getExamDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_exams').select('*, quiz_questions(*, quiz_options(*))').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.exams.find(e => e.id === id)), SIMULATE_DELAY));
    },

    // [POST] /api/quiz-attempts
    submitAttempt: async (attemptData) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_attempts').insert([attemptData]);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true, score: 90 }), SIMULATE_DELAY));
    },

    // [GET] /api/quiz-attempts/by-member/{id}
    getMyAttempts: async (memberId) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('quiz_attempts').select('*').eq('dang_vien_id', memberId);
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r([]), SIMULATE_DELAY));
    }
};
