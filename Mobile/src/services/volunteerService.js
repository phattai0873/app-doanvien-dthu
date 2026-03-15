import apiClient from './api';

export const volunteerService = {
    // [GET] /api/activities?type=Hoạt động
    getActivities: async () => {
        try {
            const res = await apiClient.get('/api/activities', {
                params: { level: 'BRANCH' } // Show all activities at Branch level regardless of status for now
            });
            // apiClient returns response.data directly
            return res.rows || [];
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
    }
};
