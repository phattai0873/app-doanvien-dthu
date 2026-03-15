const asyncHandler = require('../utils/asyncHandler');
const QuizService = require('../services/quizService');

const quizController = {
    getExams: asyncHandler(async (req, res) => {
        let { search, level, unionBranchId, unionCellId, page, limit } = req.query;
        
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            if (isBranchAdmin && req.user.unionBranchId) {
                unionBranchId = req.user.unionBranchId;
            } else if (isCellAdmin && req.user.unionCellId) {
                unionCellId = req.user.unionCellId;
            }
        }

        const result = await QuizService.getAll({ search, level, unionBranchId, unionCellId, page, limit });
        res.status(200).json({ success: true, ...result });
    }),

    getExam: asyncHandler(async (req, res) => {
        const exam = await QuizService.getById(req.params.id);
        res.status(200).json({ success: true, data: exam });
    }),

    createExam: asyncHandler(async (req, res) => {
        let { title, description, timeLimit, satisfactoryScore, startDate, endDate, questions } = req.body;
        
        let parsedQuestions = [];
        if (typeof questions === 'string') {
            try { parsedQuestions = JSON.parse(questions); } catch(e) {}
        } else if (Array.isArray(questions)) {
            parsedQuestions = questions;
        }

        const examData = {
            title, description, timeLimit, satisfactoryScore, startDate, endDate,
            questions: parsedQuestions
        };

        // Phân quyền: Tự động gán đơn vị quản lý dựa trên vai trò
        const roles = req.user?.Roles?.map(r => r.code) || [];
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        const isBranchAdmin = roles.includes('BRANCH_ADMIN');
        const isCellAdmin = roles.includes('CELL_ADMIN');

        if (!isSuperAdmin) {
            if (isCellAdmin && req.user.unionCellId) {
                examData.unionCellId = req.user.unionCellId;
                examData.level = 'CELL';
            } else if (isBranchAdmin && req.user.unionBranchId) {
                examData.unionBranchId = req.user.unionBranchId;
                examData.level = 'BRANCH';
            }
        }

        if (req.file) {
            examData.thumbnail = `/uploads/quiz/thumbnails/${req.file.filename}`;
        }

        const exam = await QuizService.create(examData);
        res.status(201).json({ success: true, data: exam });
    }),

    submitAttempt: asyncHandler(async (req, res) => {
        const { memberId, answers } = req.body;
        const result = await QuizService.submitAttempt(req.params.id, memberId, answers);
        res.status(200).json({ success: true, data: result });
    }),

    getAttempts: asyncHandler(async (req, res) => {
        let { search, unionBranchId, page, limit } = req.query;

        // Phân quyền: Chỉ thấy kết quả của đoàn viên thuộc khoa mình (nếu là Admin khoa)
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'SUPER_ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await QuizService.getAttempts(req.params.id, { search, unionBranchId, page, limit });
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = quizController;
