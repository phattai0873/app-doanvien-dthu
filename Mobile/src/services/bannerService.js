import apiClient from './api';

export const bannerService = {
    /**
     * Lấy danh sách banner đang hoạt động
     */
    getActiveBanners: async () => {
        try {
            const response = await apiClient.get('/api/banners', {
                params: { activeOnly: 'true' }
            });
            return response;
        } catch (error) {
            console.error('Error fetching banners:', error);
            return { success: false, data: [] };
        }
    }
};

export default bannerService;
