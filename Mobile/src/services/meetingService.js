import apiClient from './api';

export const meetingService = {
    // [GET] /api/meetings
    getMeetings: async (params) => {
        try {
            const res = await apiClient.get('/api/meetings', { params });
            // Handle different data structures { data: [] } or { data: { rows: [] } } or { rows: [] }
            if (Array.isArray(res.data)) return res.data;
            if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
            return res.rows || [];
        } catch (error) {
            console.error('Error fetching meetings:', error);
            throw error;
        }
    },

    // [GET] /api/meetings/{id}
    getMeetingDetail: async (id) => {
        try {
            const response = await apiClient.get(`/api/meetings/${id}`);
            return response.data || response || {};
        } catch (error) {
            console.error('Error fetching meeting detail:', error);
            throw error;
        }
    },

    // [POST] /api/meetings/{id}/check-in
    submitAttendance: async (meetingId, checkinCode) => {
        try {
            const response = await apiClient.post(`/api/meetings/${meetingId}/check-in`, { checkinCode });
            return response.data || response || {};
        } catch (error) {
            console.error('Error submitting attendance:', error);
            throw error;
        }
    },

    refreshCheckinCode: async (meetingId) => {
        try {
            const response = await apiClient.post(`/api/meetings/${meetingId}/refresh-code`);
            return response.data || response || {};
        } catch (error) {
            console.error('Error refreshing check-in code:', error);
            throw error;
        }
    },

    getLocations: async () => {
        try {
            const response = await apiClient.get('/api/locations');
            return response;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw error;
        }
    }
};

