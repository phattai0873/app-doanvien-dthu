import apiClient from './api';

export const volunteerService = {
    // [GET] /api/activities?type=Hoạt động
    getActivities: async (params = {}) => {
        try {
            const res = await apiClient.get('/api/activities', {
                params: { ...params } 
            });
            // Handle different data structures { data: [] } or { data: { rows: [] } } or { rows: [] }
            if (Array.isArray(res.data)) return res.data;
            if (res.data && Array.isArray(res.data.data)) return res.data.data;
            if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
            return [];
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },

    // [GET] /api/activities/{id}
    getActivityDetail: async (id) => {
        try {
            const res = await apiClient.get(`/api/activities/${id}`);
            return res.data || res;
        } catch (error) {
            console.error('Error fetching activity detail:', error);
            throw error;
        }
    },

    // [POST] /api/activities/{id}/register
    register: async (activityId) => {
        try {
            const res = await apiClient.post(`/api/activities/${activityId}/register`);
            return res.data;
        } catch (error) {
            console.error('Error registering for activity:', error);
            throw error;
        }
    },

    // [DELETE] /api/activities/{id}/register
    unregister: async (activityId) => {
        try {
            const res = await apiClient.delete(`/api/activities/${activityId}/register`);
            return res.data;
        } catch (error) {
            console.error('Error unregistering for activity:', error);
            throw error;
        }
    },

    // [POST] /api/activities/{id}/check-in
    checkIn: async (activityId, checkinCode) => {
        try {
            const res = await apiClient.post(`/api/activities/${activityId}/check-in`, { checkinCode });
            return res.data || res;
        } catch (error) {
            console.error('Error checking in for activity:', error);
            throw error;
        }
    },

    // [POST] /api/activities/{id}/refresh-code
    refreshCheckinCode: async (activityId) => {
        try {
            const res = await apiClient.post(`/api/activities/${activityId}/refresh-code`);
            return res.data || res;
        } catch (error) {
            console.error('Error refreshing check-in code:', error);
            throw error;
        }
    },

    // [GET] /api/activities/history
    getMyHistory: async () => {
        try {
            const res = await apiClient.get('/api/activities/history');
            return res.data || res;
        } catch (error) {
            console.error('Error fetching activity history:', error);
            throw error;
        }
    }
};
