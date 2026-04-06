const express = require('express');
const router = express.Router();
const unionMemberController = require('../controllers/unionMemberController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', checkPermission('member:read'), unionMemberController.getMembers);
router.get('/me', unionMemberController.getMyProfile);
router.post('/', checkPermission('member:create'), unionMemberController.createMember);
router.get('/:id', checkPermission('member:read'), unionMemberController.getMember);
router.put('/:id', checkPermission('member:update'), unionMemberController.updateMember);
router.delete('/:id', checkPermission('member:delete'), unionMemberController.deleteMember);
router.patch('/:id/restore', checkPermission('member:delete'), unionMemberController.restoreMember);
router.delete('/:id/force', checkPermission('member:delete'), unionMemberController.forceDeleteMember);
router.post('/:id/positions', checkPermission('member:update'), unionMemberController.assignPosition);
router.patch('/:id/approve', checkPermission('member:approve'), unionMemberController.approveMember);
router.patch('/:id/reject', checkPermission('member:approve'), unionMemberController.rejectMember);

module.exports = router;
