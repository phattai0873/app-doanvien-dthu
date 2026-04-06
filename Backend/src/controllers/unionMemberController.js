const asyncHandler = require('../utils/asyncHandler');
const UnionMemberService = require('../services/unionMemberService');

const unionMemberController = {
    getMembers: asyncHandler(async (req, res) => {
        const { unionCellId, unionBranchId, search, page, limit, roleInUnion, activityStatus, status, gender, onlyDeleted } = req.query;
 
        const result = await UnionMemberService.getAll({ 
            unionCellId, 
            unionBranchId, 
            search, 
            page, 
            limit,
            roleInUnion, 
            activityStatus, 
            status, 
            gender,
            onlyDeleted: onlyDeleted === 'true',
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    getMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getById(req.params.id, req.user);
        res.status(200).json({ success: true, data: member });
    }),

    getMyProfile: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.getByUserId(req.user.id);
        res.status(200).json({ success: true, data: member });
    }),

    createMember: asyncHandler(async (req, res) => {
        const data = { ...req.body };
        if (!data.userId && req.user) {
            data.userId = req.user.id;
        }
        const member = await UnionMemberService.create(data, req.user);
        res.status(201).json({ success: true, data: member });
    }),

    updateMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.update(req.params.id, req.body, req.user.id, req.user);
        res.status(200).json({ success: true, data: member });
    }),

    deleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.delete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    restoreMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.restore(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.forceDelete(req.params.id, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    assignPosition: asyncHandler(async (req, res) => {
        const { positionId, branchId, cellId, assignedDate, moveMember } = req.body;
        const result = await UnionMemberService.assignPosition(req.params.id, positionId, { branchId, cellId, assignedDate, moveMember }, req.user);
        res.status(200).json({ success: true, data: result });
    }),

    approveMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.approve(req.params.id, req.user);
        res.status(200).json({ success: true, ...result });
    }),

    rejectMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.reject(req.params.id, req.user);
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = unionMemberController;
