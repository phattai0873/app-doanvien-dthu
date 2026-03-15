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
            roleInUnion, activityStatus, status, gender
        });
        res.status(200).json({ success: true, ...result });
    }),

    getMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getById(req.params.id);
        res.status(200).json({ success: true, data: member });
    }),

    createMember: asyncHandler(async (req, res) => {
        const data = req.body;
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            if (isBranchAdmin) {
                // For Branch Admin, they must specify a unionCellId within their branch.
                // Service handles filtering if needed, but here we just ensure they can't set branch directly (it's derived)
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
