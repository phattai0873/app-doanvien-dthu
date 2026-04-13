import apiClient, { USE_MOCK_API, USE_SUPABASE, API_BASE_URL } from './api';
import { supabase } from './supabaseClient';
import { MOCK_DB } from '../constants/mockData';

const SIMULATE_DELAY = 500;

export const partyService = {
    // 1. Đoàn bộ (Union Branches) - /api/branches
    getCommittees: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_committees').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r([MOCK_DB.party_committee]), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/branches');
        return response.data || [];
    },

    getCommitteeDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_committees').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.party_committee), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/branches/${id}`);
        return response.data;
    },

    // 2. Chi đoàn (Union Cells) - /api/cells
    getCells: async (params = {}) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_cells').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r([MOCK_DB.party_cell]), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/cells', { params });
        return response.data || [];
    },

    getCellDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_cells').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.party_cell), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/cells/${id}`);
        return response.data;
    },

    getCommitteesAll: async () => {
        const response = await apiClient.get('/api/branches/all');
        // response là body { success, data }
        return response.data || response || [];
    },

    getCellsAll: async (branchId) => {
        const params = branchId && branchId !== '' ? { unionBranchId: branchId } : {};
        const response = await apiClient.get('/api/cells/all', { params });
        // response là body { success, data }
        return response.data || response || [];
    },

    // 3. Đoàn viên (Union Members) - /api/members
    getMembers: async (params = {}) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_members').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.members), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/members', { params });
        // Backend returns { success, data: [] }
        const rawItems = response.data || [];
        return rawItems.map(item => ({
            ...item,
            ho_ten: item.fullName,
            ma_dang_vien: item.memberCode,
            is_active: item.status === 'active'
        }));
    },

    getMemberDetail: async (id) => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_members').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.user), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get(`/api/members/${id}`);
        return response;
    },

    approveMember: async (id) => {
        const response = await apiClient.patch(`/api/members/${id}/approve`);
        return response;
    },

    rejectMember: async (id) => {
        const response = await apiClient.patch(`/api/members/${id}/reject`);
        return response;
    },

    getMyMemberProfile: async () => {
        // [GET] /api/members/me
        try {
            const response = await apiClient.get('/api/members/me');
            return response;
        } catch (error) {
            return null;
        }
    },

    createMemberProfile: async (data) => {
        // [POST] /api/members
        const response = await apiClient.post('/api/members', data);
        return response;
    },

    getMemberProfile: async () => {
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.user), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/users/me'); 
        const userData = response.data || response;
        const member = userData.UnionMember || {};
        
        // Trả về camelCase đồng nhất với Backend, chỉ xử lý URL avatar
        return {
            ...userData,
            unionMember: {
                ...member,
                avatarUrl: userData.avatar ? `${API_BASE_URL}${userData.avatar}` : 
                           (member.avatar ? `${API_BASE_URL}${member.avatar}` : null)
            }
        };
    },

    updateMemberProfile: async (id, data) => {
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r({ success: true }), SIMULATE_DELAY));
        const response = await apiClient.put(`/api/members/${id}`, data);
        return response;
    },

    // 4. Custom: My Profile (Composite)
    getMyPartyProfile: async (memberId) => {
        if (USE_SUPABASE) {
            const { data: member, error: mErr } = await supabase.from('party_members').select('*, party_cells(*)').eq('id', memberId).single();
            if (mErr) throw mErr;
            return { member: member, cell: member.party_cells, committee: null };
        }
        if (USE_MOCK_API) {
            return new Promise(r => {
                setTimeout(() => {
                    r({ member: MOCK_DB.user, cell: MOCK_DB.party_cell, committee: MOCK_DB.party_committee });
                }, SIMULATE_DELAY);
            });
        }

        // API THỰC
        const response = await apiClient.get('/api/users/me');
        const userData = response.data || response;
        return {
            member: userData,
            cell: userData.UnionMember?.UnionCell || null,
            committee: userData.UnionMember?.UnionCell?.UnionBranch || null
        };
    },

    getOrgInfo: async () => {
        if (USE_MOCK_API) {
            return new Promise(r => {
                setTimeout(() => {
                    r({
                        cell: { ...MOCK_DB.party_cell, ten_chi_bo: MOCK_DB.party_cell.ten_chi_doan, ma_chi_bo: MOCK_DB.party_cell.ma_chi_doan, so_dang_vien: MOCK_DB.party_cell.so_doan_vien },
                        committee: MOCK_DB.party_committee
                    });
                }, SIMULATE_DELAY);
            });
        }

        // API THỰC: Tận dụng dữ liệu đã có trong profile
        try {
            const response = await apiClient.get('/api/users/me');
            const userData = response.data || response;
            const member = userData?.UnionMember || {};
            const cell = member.UnionCell || null;
            const branch = cell?.UnionBranch || null;

            return {
                cell: cell,
                committee: branch
            };
        } catch (e) {
            console.error('Error fetching org info:', e);
            return { cell: null, committee: null };
        }
    },

    // 5. Duyệt cập đóng hồ sơ (Profile Update Approval)
    getProfileUpdateRequests: async (params = {}) => {
        const response = await apiClient.get('/api/members/requests/updates', { params });
        return response.data || [];
    },

    approveProfileUpdate: async (id) => {
        const response = await apiClient.patch(`/api/members/requests/updates/${id}/approve`);
        return response;
    },

    rejectProfileUpdate: async (id, note) => {
        const response = await apiClient.patch(`/api/members/requests/updates/${id}/reject`, { note });
        return response;
    }
};
