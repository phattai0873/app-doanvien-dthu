const asyncHandler = require('../utils/asyncHandler');
const QuizService = require('../services/quizService');

const quizController = {
    getExams: asyncHandler(async (req, res) => {
        let { search, level, unionBranchId, unionCellId, page, limit } = req.query;
        
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');
        const isAdmin = isSuperAdmin || isBranchAdmin || isCellAdmin;
        
        let status = req.query.status;

        if (!isSuperAdmin) {
            const member = req.user?.UnionMember;
            if (member) {
                if (member.unionCellId) {
                    unionCellId = member.unionCellId;
                }
                const branchId = member.unionBranchId || member.UnionCell?.unionBranchId;
                if (branchId) {
                    unionBranchId = branchId;
                }
            }

            // Nếu không phải Admin, chỉ được xem kỳ thi đã đăng
            if (!isAdmin) {
                status = 'PUBLISHED';
            }
        }

        const result = await QuizService.getAll({ 
            search, level, status, 
            unionBranchId, unionCellId, page, limit,
            onlyDeleted: req.query.onlyDeleted === 'true',
            user: req.user
        });
        res.status(200).json({ success: true, ...result });
    }),

    getExam: asyncHandler(async (req, res) => {
        const exam = await QuizService.getById(req.params.id);
        res.status(200).json({ success: true, data: exam });
    }),

    createExam: asyncHandler(async (req, res) => {
        let { title, description, timeLimit, satisfactoryScore, startDate, endDate, status, questions } = req.body;
        
        let parsedQuestions = [];
        if (typeof questions === 'string') {
            try { parsedQuestions = JSON.parse(questions); } catch(e) {}
        } else if (Array.isArray(questions)) {
            parsedQuestions = questions;
        }

        const examData = {
            title, description, timeLimit, satisfactoryScore, startDate, endDate, status,
            questions: parsedQuestions
        };

        // Phân quyền: Tự động gán đơn vị quản lý dựa trên vai trò
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            const member = req.user?.UnionMember;
            if (member) {
                if (isCellAdmin && member.unionCellId) {
                    examData.unionCellId = member.unionCellId;
                    examData.level = 'CELL';
                    const branchId = member.unionBranchId || member.UnionCell?.unionBranchId;
                    if (branchId) examData.unionBranchId = branchId;
                } else {
                    const branchId = member.unionBranchId || member.UnionCell?.unionBranchId;
                    if (branchId) {
                        examData.unionBranchId = branchId;
                        examData.level = 'BRANCH';
                    }
                }
            }
        }

        if (req.file) {
            examData.thumbnail = `/uploads/quiz/thumbnails/${req.file.filename}`;
        }

        const exam = await QuizService.create(examData);
        res.status(201).json({ success: true, data: exam });
    }),

    submitAttempt: asyncHandler(async (req, res) => {
        let { memberId, answers } = req.body;
        
        // Nếu không gửi memberId, tự lấy từ user đã đăng nhập
        if (!memberId) {
            memberId = req.user?.UnionMember?.id;
        }
        
        if (!memberId) {
            throw new ErrorResponse('Không xác định được thông tin đoàn viên thực hiện bài thi', 400);
        }

        const result = await QuizService.submitAttempt(req.params.id, memberId, answers);
        res.status(200).json({ success: true, data: result });
    }),

    getAttempts: asyncHandler(async (req, res) => {
        let { search, unionBranchId, page, limit } = req.query;

        // Phân quyền: Chỉ thấy kết quả của đoàn viên thuộc khoa mình (nếu là Admin khoa)
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember) {
            const branchId = userUnionMember.unionBranchId || userUnionMember.UnionCell?.unionBranchId;
            if (branchId) unionBranchId = branchId;
        }

        const result = await QuizService.getAttempts(req.params.id, { search, unionBranchId, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    updateExam: asyncHandler(async (req, res) => {
        let { title, description, timeLimit, satisfactoryScore, startDate, endDate, status, questions } = req.body;
        
        const exam = await QuizService.getById(req.params.id);
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);

        let parsedQuestions = questions;
        if (typeof questions === 'string') {
            try { parsedQuestions = JSON.parse(questions); } catch(e) {}
        }

        const examData = {
            title, description, timeLimit, satisfactoryScore, startDate, endDate, status,
            questions: parsedQuestions
        };

        if (req.file) {
            examData.thumbnail = `/uploads/quiz/thumbnails/${req.file.filename}`;
        }

        const updated = await QuizService.update(req.params.id, examData);
        res.status(200).json({ success: true, data: updated });
    }),

    deleteExam: asyncHandler(async (req, res) => {
        const result = await QuizService.delete(req.params.id);
        res.status(200).json({ success: true, ...result });
    }),

    restoreQuiz: asyncHandler(async (req, res) => {
        const result = await QuizService.restoreQuiz(req.params.id);
        res.status(200).json({ success: true, data: result });
    }),

    forceDeleteQuiz: asyncHandler(async (req, res) => {
        const result = await QuizService.forceDeleteQuiz(req.params.id);
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = quizController;
