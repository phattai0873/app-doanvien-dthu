const { QuizExam, QuizQuestion, QuizOption, QuizAttempt, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class QuizService {
    static async getAll({ search, unionBranchId, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');
        
        const where = {
            ...buildSearchCondition(search, ['title', 'description'])
        };

        if (unionBranchId) {
            where[Op.or] = [
                { unionBranchId: unionBranchId },
                { unionBranchId: null }
            ];
        }

        const result = await QuizExam.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const exam = await QuizExam.findByPk(id, {
            include: [{
                model: QuizQuestion,
                include: [{ model: QuizOption }],
                order: [['order', 'ASC']]
            }]
        });
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);
        return exam;
    }

    static async create(data) {
        const { questions, ...examData } = data;
        const exam = await QuizExam.create(examData);

        if (questions && questions.length) {
            await Promise.all(questions.map(async (q, idx) => {
                const question = await QuizQuestion.create({
                    examId: exam.id,
                    content: q.content,
                    questionType: q.questionType || 'SINGLE',
                    score: q.score || 1,
                    order: q.order ?? idx
                });
                if (q.options && q.options.length) {
                    await Promise.all(q.options.map(opt =>
                        QuizOption.create({
                            questionId: question.id,
                            content: opt.content,
                            isCorrect: opt.isCorrect || false
                        })
                    ));
                }
            }));
        }

        return this.getById(exam.id);
    }

    static async submitAttempt(examId, memberId, answers) {
        const exam = await QuizExam.findByPk(examId, {
            include: [{ model: QuizQuestion, include: [{ model: QuizOption }] }]
        });
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);

        const member = await UnionMember.findByPk(memberId);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        let totalScore = 0;
        let correctCount = 0;

        for (const question of exam.QuizQuestions) {
            const userAnswer = answers.find(a => a.questionId === question.id);
            if (!userAnswer) continue;

            const correctOptions = question.QuizOptions.filter(o => o.isCorrect).map(o => o.id);
            const isCorrect = userAnswer.optionIds &&
                correctOptions.length === userAnswer.optionIds.length &&
                userAnswer.optionIds.every(id => correctOptions.includes(id));

            if (isCorrect) {
                totalScore += question.score;
                correctCount++;
            }
        }

        const attempt = await QuizAttempt.create({
            examId,
            unionMemberId: memberId,
            score: totalScore,
            correctAnswersCount: correctCount,
            submitTime: new Date()
        });

        return { ...attempt.toJSON(), isPassed: totalScore >= exam.satisfactoryScore };
    }

    static async getAttempts(examId, { search, unionBranchId, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const result = await QuizAttempt.findAndCountAll({
            where: { examId },
            include: [{
                model: UnionMember,
                attributes: ['id', 'fullName', 'memberCode', 'unionBranchId'],
                where: {
                    ...(search && buildSearchCondition(search, ['fullName', 'memberCode'])),
                    ...(unionBranchId && { unionBranchId })
                },
                required: true // Bắt buộc phải khớp filter member
            }],
            order: [['score', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }
}

module.exports = QuizService;
