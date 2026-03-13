import apiClient from './api';

export const branchService = {
    // [GET] /api/branches/stats
    getBranchStats: async (id = null) => {
        const url = id ? `/api/branches/${id}/stats` : '/api/branches/stats';
        const response = await apiClient.get(url);
        return response.data;
    }
};
