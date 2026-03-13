const asyncHandler = require('../utils/asyncHandler');
const QuizService = require('../services/quizService');

const quizController = {
    getExams: asyncHandler(async (req, res) => {
        let { search, unionBranchId, page, limit } = req.query;
        
        // Phân quyền: Thấy kỳ thi của khoa mình + kỳ thi chung toàn trường
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await QuizService.getAll({ search, unionBranchId, page, limit });
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

        // Tự động gán khoa nếu là Admin khoa
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            examData.unionBranchId = userUnionMember.unionBranchId;
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
        const isSuperAdmin = req.user?.Roles?.some(r => r.code === 'ADMIN');
        const userUnionMember = req.user?.UnionMember;

        if (!isSuperAdmin && userUnionMember?.unionBranchId) {
            unionBranchId = userUnionMember.unionBranchId;
        }

        const result = await QuizService.getAttempts(req.params.id, { search, unionBranchId, page, limit });
        res.status(200).json({ success: true, ...result });
    })
};

module.exports = quizController;
