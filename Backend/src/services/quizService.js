const { QuizExam, QuizQuestion, QuizOption, QuizAttempt, UnionMember } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');

class QuizService {
    static async getAll({ search, level, status: reqStatus, unionBranchId, unionCellId, page, limit, onlyDeleted, publishedOnly, user } = {}) {
        const { Op } = require('sequelize');
        const now = new Date();
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        // 1. Áp dụng bộ lọc phạm vi tự động (ABAC)
        const { getScopeFilter } = require('../utils/permissionHelper');
        const scopeFilter = getScopeFilter(user, 'quiz');

        const where = {
            ...buildSearchCondition(search, ['title', 'summary']),
            ...(level && { level }),
            ...(unionBranchId && { unionBranchId }),
            ...(unionCellId && { unionCellId })
        };

        // 2. Xử lý trạng thái công khai (Published vs Draft)
        if (publishedOnly) {
            where.status = { [Op.ne]: 'DRAFT' };
        }

        // 3. Xử lý bộ lọc trạng thái thời gian (Dynamic Status Handling)
        if (reqStatus && ['UPCOMING', 'ONGOING', 'FINISHED'].includes(reqStatus)) {
            const timeFilter = {};
            if (reqStatus === 'UPCOMING') {
                timeFilter.startDate = { [Op.gt]: now };
            } else if (reqStatus === 'FINISHED') {
                timeFilter.endDate = { [Op.lt]: now };
            } else if (reqStatus === 'ONGOING') {
                timeFilter[Op.and] = [
                    { startDate: { [Op.lte]: now } },
                    { endDate: { [Op.gte]: now } }
                ];
            }
            
            // Kết hợp điều kiện thời gian
            where[Op.and] = where[Op.and] || [];
            where[Op.and].push(timeFilter);
            
            // Xóa status khỏi where nếu nó đang được dùng để lọc draft/published
            // để tránh xung đột với cột status cũ (nếu có)
            if (reqStatus !== 'DRAFT') {
                where.status = { [Op.ne]: 'DRAFT' };
            }
        }

        // 4. Kết hợp Automated Scoping
        if (scopeFilter && Object.keys(scopeFilter).length > 0) {
            where[Op.and] = where[Op.and] || [];
            where[Op.and].push(scopeFilter);
        }

        const { sequelize } = require('../configs/db');
        const queryOptions = {
            where,
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM quiz_questions AS qst
                            WHERE
                                qst."examId" = "QuizExam"."id"
                        )`),
                        'totalQuestions'
                    ]
                ]
            },
            order: onlyDeleted ? [['deletedAt', 'DESC']] : [['createdAt', 'DESC']],
            limit: l,
            offset
        };

        if (onlyDeleted) {
            queryOptions.paranoid = false;
            where.deletedAt = { [Op.ne]: null };
        }

        const rows = await QuizExam.findAll(queryOptions);
        
        const count = await QuizExam.count({ where });
        const result = { rows, count };

        return formatPaginatedResponse(result, p, l);
    }

    static async getById(id) {
        const exam = await QuizExam.findByPk(id, {
            paranoid: false,
            include: [{
                model: QuizQuestion,
                paranoid: false,
                include: [{ model: QuizOption, paranoid: false }],
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
            const existingQs = await QuizQuestion.findAll({ where: { examId: id }, paranoid: false });
            const qIds = existingQs.map(q => q.id);
            
            // Dùng force: true để xóa thật khi cập nhật (clean up)
            await QuizOption.destroy({ where: { questionId: qIds }, force: true });
            await QuizQuestion.destroy({ where: { examId: id }, force: true });

            if (questions.length) {
                await this._createQuestions(id, questions);
            }
        }

        return this.getById(id);
    }

    static async delete(id) {
        const exam = await QuizExam.findByPk(id);
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);
        await exam.destroy();
        return { message: 'Đã chuyển kỳ thi vào thùng rác' };
    }

    static async restoreQuiz(id) {
        const exam = await QuizExam.findByPk(id, { paranoid: false });
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi trong thùng rác', 404);
        if (!exam.deletedAt) throw new ErrorResponse('Kỳ thi này chưa bị xóa', 400);

        await exam.restore();
        return exam;
    }

    static async forceDeleteQuiz(id) {
        const exam = await QuizExam.findByPk(id, { paranoid: false });
        if (!exam) throw new ErrorResponse('Không tìm thấy kỳ thi', 404);

        // Xóa thật questions và options kèm theo (nếu chưa cascade ở tầng DB)
        const qIds = (await QuizQuestion.findAll({ where: { examId: id }, paranoid: false })).map(q => q.id);
        await QuizOption.destroy({ where: { questionId: qIds }, force: true });
        await QuizQuestion.destroy({ where: { examId: id }, force: true });

        await exam.destroy({ force: true });
        return { message: 'Đã xóa vĩnh viễn kỳ thi và dữ liệu liên quan' };
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
        const { UnionCell } = require('../models');

        const memberWhere = {};
        if (search) {
            const { buildSearchCondition } = require('../utils/paginate');
            Object.assign(memberWhere, buildSearchCondition(search, ['fullName', 'memberCode']));
        }

        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'unionBranchId'],
            required: !!unionBranchId
        };
        if (unionBranchId) {
            cellInclude.where = { unionBranchId };
        }

        const result = await QuizAttempt.findAndCountAll({
            where: { examId },
            include: [{
                model: UnionMember,
                attributes: ['id', 'fullName', 'memberCode'],
                where: memberWhere,
                required: true,
                include: [cellInclude]
            }],
            order: [['score', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }
}

module.exports = QuizService;
