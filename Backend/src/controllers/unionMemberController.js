const asyncHandler = require('../utils/asyncHandler');
const UnionMemberService = require('../services/unionMemberService');
const ExcelService = require('../services/excelService');
const ErrorResponse = require('../utils/errorResponse');
const cacheService = require('../services/cacheService');

const unionMemberController = {
    // ... existing methods (omitted for brevity in instruction, but keep them)
    
    importPreview: asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ErrorResponse('Vui lòng chọn file Excel để tải lên', 400);
        }

        const { mode, unionCellId } = req.body;
        const results = await ExcelService.generatePreview(
            req.file.buffer, 
            { mode, unionCellId }, 
            req.user
        );
        res.status(200).json({ success: true, ...results });
    }),

    importConfirm: asyncHandler(async (req, res) => {
        const { previewId, strictMode } = req.body;
        if (!previewId) {
            throw new ErrorResponse('Missing previewId', 400);
        }

        const results = await ExcelService.executeImport(previewId, { strictMode }, req.user);
        
        // Invalidate stats and members cache
        await cacheService.delPattern('__cache__:*:/api/stats*');
        await cacheService.delPattern('__cache__:*:/api/members*');

        res.status(200).json({ success: true, ...results });
    }),
    
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
        
        await cacheService.delPattern('__cache__:*:/api/stats*');
        await cacheService.delPattern('__cache__:*:/api/members*');

        res.status(201).json({ success: true, data: member });
    }),

    updateMember: asyncHandler(async (req, res) => {
        const member = await UnionMemberService.update(req.params.id, req.body, req.user.id, req.user);
        
        await cacheService.delPattern('__cache__:*:/api/stats*');
        await cacheService.delPattern('__cache__:*:/api/members*');

        res.status(200).json({ success: true, data: member });
    }),

    deleteMember: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.delete(req.params.id, req.user);
        await cacheService.delPattern('__cache__:*:/api/stats*');
        await cacheService.delPattern('__cache__:*:/api/members*');
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
    }),

    getUpdateRequests: asyncHandler(async (req, res) => {
        const { status } = req.query;
        const requests = await UnionMemberService.getProfileUpdateRequests(req.user, status || 'pending');
        res.status(200).json({ success: true, data: requests });
    }),

    approveUpdate: asyncHandler(async (req, res) => {
        const result = await UnionMemberService.approveProfileUpdate(req.params.id, req.user);
        res.status(200).json({ success: true, ...result });
    }),

    rejectUpdate: asyncHandler(async (req, res) => {
        const { note } = req.body;
        const result = await UnionMemberService.rejectProfileUpdate(req.params.id, req.user, note);
        res.status(200).json({ success: true, ...result });
    }),

    bulkDeleteMember: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) throw new ErrorResponse('Missing ids array', 400);
        const result = await UnionMemberService.bulkDelete(ids, req.user);
        res.status(200).json({ success: true, ...result });
    }),

    bulkRestoreMember: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) throw new ErrorResponse('Missing ids array', 400);
        const result = await UnionMemberService.bulkRestore(ids, req.user);
        res.status(200).json({ success: true, ...result });
    }),

    bulkForceDeleteMember: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) throw new ErrorResponse('Missing ids array', 400);
        const result = await UnionMemberService.bulkForceDelete(ids, req.user);
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = unionMemberController;
