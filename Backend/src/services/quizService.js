const { QuizExam, QuizQuestion, QuizOption, QuizAttempt, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class QuizService {
    static async getAll({ search, level, status: reqStatus, unionBranchId, unionCellId, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const { Op } = require('sequelize');
        const now = new Date();

        const where = {
            ...buildSearchCondition(search, ['title', 'description']),
            ...(level && { level })
        };

        if (reqStatus === 'UPCOMING') {
            where.startDate = { [Op.gt]: now };
        } else if (reqStatus === 'FINISHED') {
            where.endDate = { [Op.lt]: now };
        } else if (reqStatus === 'ONGOING') {
            where[Op.and] = [
                { startDate: { [Op.lte]: now } },
                { endDate: { [Op.gte]: now } }
            ];
        }

        if (unionCellId) {
            where.unionCellId = unionCellId;
        } else if (unionBranchId) {
            where[Op.and] = [
                { unionBranchId },
                { level: { [Op.ne]: 'CELL' } }
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
            await this._createQuestions(exam.id, questions);
        }

        return this.getById(exam.id);
    }

    static async update(id, data) {
        const exam = await QuizExam.findByPk(id);
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);

        const { questions, ...examData } = data;
        await exam.update(examData);

        if (questions) {
            // Simple approach: delete existing questions and re-create
            // 1. Get question ids to delete options first (or use cascade if set up)
            const existingQs = await QuizQuestion.findAll({ where: { examId: id } });
            const qIds = existingQs.map(q => q.id);
            
            await QuizOption.destroy({ where: { questionId: qIds } });
            await QuizQuestion.destroy({ where: { examId: id } });

            if (questions.length) {
                await this._createQuestions(id, questions);
            }
        }

        return this.getById(id);
    }

    static async delete(id) {
        const exam = await QuizExam.findByPk(id);
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);
        
        // Soft delete or hard delete? Let's do hard delete for now if relations are set to cascade
        // Or deactivate it.
        await exam.destroy();
        return true;
    }

    static async _createQuestions(examId, questions) {
        for (let idx = 0; idx < questions.length; idx++) {
            const q = questions[idx];
            const question = await QuizQuestion.create({
                examId,
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
        }
    }

    static async submitAttempt(examId, memberId, answers) {
        const exam = await QuizExam.findByPk(examId, {
            include: [{ model: QuizQuestion, include: [{ model: QuizOption }] }]
        });
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);

        const member = await UnionMember.findByPk(memberId);
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);

        // Kiểm tra thời gian
        const now = new Date();
        if (exam.startDate && now < new Date(exam.startDate)) {
            throw new ErrorResponse('Kỳ thi chưa bắt đầu', 400);
        }
        if (exam.endDate && now > new Date(exam.endDate)) {
            throw new ErrorResponse('Kỳ thi đã kết thúc', 400);
        }

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
