const express = require('express');
const router = express.Router();
const unionMemberController = require('../controllers/unionMemberController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', unionMemberController.getMembers);
router.get('/me', unionMemberController.getMyProfile);
router.post('/', unionMemberController.createMember);
router.get('/:id', unionMemberController.getMember);
router.put('/:id', unionMemberController.updateMember);
router.delete('/:id', unionMemberController.deleteMember);
router.patch('/:id/restore', unionMemberController.restoreMember);
router.delete('/:id/force', unionMemberController.forceDeleteMember);
router.post('/:id/positions', unionMemberController.assignPosition);
router.patch('/:id/approve', unionMemberController.approveMember);
router.patch('/:id/reject', unionMemberController.rejectMember);

module.exports = router;
