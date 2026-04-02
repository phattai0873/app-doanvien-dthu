const asyncHandler = require('../utils/asyncHandler');
const UnionMemberService = require('../services/unionMemberService');

const unionMemberController = {
    getMembers: asyncHandler(async (req, res) => {
        let { unionCellId, unionBranchId, search, page, limit, roleInUnion, activityStatus, status, gender } = req.query;
        
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');
        
        if (!isSuperAdmin) {
            // Use scouting fields from User model
            if (isBranchAdmin && req.user.unionBranchId) {
                unionBranchId = req.user.unionBranchId;
            } else if (isCellAdmin && req.user.unionCellId) {
                unionCellId = req.user.unionCellId;
            }
        }

        const result = await UnionMemberService.getAll({ 
            unionCellId, unionBranchId, search, page, limit,
            roleInUnion, activityStatus, status, gender,
            onlyDeleted: req.query.onlyDeleted === 'true'
        });
        res.status(200).json({ success: true, ...result });
    }),

    getMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getById(req.params.id);
        res.status(200).json({ success: true, data: member });
    }),

    getMyProfile: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getByUserId(req.user.id);
        // Nếu không có member, vẫn trả về success: true nhưng data: null hoặc lỗi nhẹ
        res.status(200).json({ success: true, data: member });
    }),

    createMember: asyncHandler(async (req, res) => {
        const data = req.body;
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        // Nếu là user tự hoàn thiện hồ sơ (không truyền userId hoặc userId khớp)
        if (!data.userId) {
            data.userId = req.user.id;
        }

        if (!isSuperAdmin) {
            if (isBranchAdmin) {
                // For Branch Admin
            } else if (isCellAdmin && req.user.unionCellId) {
                data.unionCellId = req.user.unionCellId;
            }
        }

        const member = await UnionMemberService.create(data);
        res.status(201).json({ success: true, data: member });
    }),

    updateMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.update(req.params.id, req.body, req.user.id);
        res.status(200).json({ success: true, data: member });
    }),

    deleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    restoreMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.restore(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.forceDelete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    assignPosition: asyncHandler(async (req, res) => {
        const { positionId, cellId, assignedDate } = req.body;
        const result = await UnionMemberService.assignPosition(req.params.id, positionId, cellId, assignedDate, req.user.id);
        res.status(201).json({ success: true, data: result });
    }),

    approveMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.approve(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    }),

    rejectMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.reject(req.params.id, req.user.id);
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = unionMemberController;
