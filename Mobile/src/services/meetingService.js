import apiClient from './api';

export const meetingService = {
    // [GET] /api/meetings
    getMeetings: async (params) => {
        try {
            const response = await apiClient.get('/api/meetings', { params });
            // apiClient already returns response.data
            return response || { rows: [], count: 0 };
        } catch (error) {
            console.error('Error fetching meetings:', error);
            throw error;
        }
    },

    // [GET] /api/meetings/{id}
    getMeetingDetail: async (id) => {
        try {
            const response = await apiClient.get(`/api/meetings/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching meeting detail:', error);
            throw error;
        }
    },

    // [POST] /api/meetings/{id}/check-in
    submitAttendance: async (meetingId, checkinCode) => {
        try {
            const response = await apiClient.post(`/api/meetings/${meetingId}/check-in`, { checkinCode });
            return response.data;
        } catch (error) {
            console.error('Error submitting attendance:', error);
            throw error;
        }
    },

    refreshCheckinCode: async (meetingId) => {
        try {
            const response = await apiClient.post(`/api/meetings/${meetingId}/refresh-code`);
            return response.data;
        } catch (error) {
            console.error('Error refreshing check-in code:', error);
            throw error;
        }
    },

    getLocations: async () => {
        try {
            const response = await apiClient.get('/api/locations');
            return response.data?.rows || [];
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw error;
        }
    }
};

