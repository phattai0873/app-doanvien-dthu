const asyncHandler = require('../utils/asyncHandler');
const UnionMemberService = require('../services/unionMemberService');

const unionMemberController = {
    getMembers: asyncHandler(async (req, res) => {
        let { unionCellId, unionBranchId, search, page, limit } = req.query;
        
        // Nếu không phải Super Admin, chỉ cho phép xem đoàn viên thuộc Liên chi đoàn của mình
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;
        
        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await UnionMemberService.getAll({ unionCellId, unionBranchId, search, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getById(req.params.id);
        res.status(200).json({ success: true, data: member });
    }),

    createMember: asyncHandler(async (req, res) => {
        const data = req.body;

        // Tự động gán Liên chi đoàn nếu không phải Super Admin
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            data.unionBranchId = userUnionMember.unionBranchId;
        }

        const member = await UnionMemberService.create(data);
        res.status(201).json({ success: true, data: member });
    }),

    updateMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: member });
    }),

    deleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    assignPosition: asyncHandler(async (req, res) => {
        const { positionId, cellId, assignedDate } = req.body;
        const result = await UnionMemberService.assignPosition(req.params.id, positionId, cellId, assignedDate);
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
