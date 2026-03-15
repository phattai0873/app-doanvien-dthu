import apiClient, { USE_MOCK_API, USE_SUPABASE } from './api';
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
    getCells: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_cells').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r([MOCK_DB.party_cell]), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/cells');
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

    // 3. Đoàn viên (Union Members) - /api/members
    getMembers: async () => {
        if (USE_SUPABASE) {
            const { data, error } = await supabase.from('party_members').select('*');
            if (error) throw error;
            return data;
        }
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.members), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/members');
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
        return response.data;
    },

    approveMember: async (id) => {
        const response = await apiClient.patch(`/api/members/${id}/approve`);
        return response;
    },

    rejectMember: async (id) => {
        const response = await apiClient.patch(`/api/members/${id}/reject`);
        return response;
    },

    getMemberProfile: async () => {
        if (USE_MOCK_API) return new Promise(r => setTimeout(() => r(MOCK_DB.user), SIMULATE_DELAY));

        // API THỰC
        const response = await apiClient.get('/api/users/me'); // response is response.data
        const userData = response.data || response;
        const member = userData.UnionMember || {};
        
        // Map backend fields to frontend expected fields
        return {
            ...userData,
            ho_ten: member.fullName || userData.username,
            chuc_vu_doan: member.roleInUnion === 'member' ? 'Đoàn viên' : 
                         member.roleInUnion === 'secretary' ? 'Bí thư' :
                         member.roleInUnion === 'vice_secretary' ? 'Phó Bí thư' : 'Cán bộ Đoàn',
            trang_thai_doan: member.status === 'approved' ? 'Đang hoạt động' : 'Chờ duyệt',
            anh_dai_dien: member.avatar ? `${apiClient.defaults.baseURL}${member.avatar}` : 'https://picsum.photos/200',
            sdt: member.phoneNumber,
            email: member.email,
            cccd: member.identityNumber,
            ngay_sinh: member.dateOfBirth,
            dia_chi: member.permanentAddress,
            is_verified: member.status === 'approved'
        };
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
        return {
            member: response.user || response.data,
            cell: null, // Should be linked in user record or fetched
            committee: null
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

        // API THỰC
        try {
            const cellRes = await apiClient.get('/api/cells/my');
            const branchRes = await apiClient.get('/api/branches/my');
            return {
                cell: cellRes.data,
                committee: branchRes.data
            };
        } catch (e) {
            return { cell: null, committee: null };
        }
    }
};

