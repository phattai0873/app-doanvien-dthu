const { UnionFeePayment, UnionMember, UnionCell, UnionBranch } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { getPagination, formatPaginatedResponse, buildSearchCondition } = require('../utils/paginate');
const { Op } = require('sequelize');

class FeeService {
    static async getAll({ period, memberId, unionCellId, unionBranchId, search, page, limit } = {}) {
        const { page: p, limit: l, offset } = getPagination({ page, limit });
        const where = {
            ...(period && { period }),
            ...(memberId && { unionMemberId: memberId }),
            ...(unionCellId && { unionCellId }),
            ...(unionBranchId && { unionBranchId })
        };

        const result = await UnionFeePayment.findAndCountAll({
            where,
            include: [
                {
                    model: UnionMember,
                    attributes: ['id', 'fullName', 'memberCode'],
                    where: search ? buildSearchCondition(search, ['fullName', 'memberCode']) : undefined,
                    required: !!search
                },
                {
                    model: UnionCell,
                    attributes: ['id', 'name']
                }
            ],
            order: [['paymentDate', 'DESC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async create(data) {
        const member = await UnionMember.findByPk(data.unionMemberId, {
            include: [{ model: UnionCell }]
        });
        if (!member) throw new ErrorResponse('Không tìm thấy đoàn viên', 404);
        
        // Gán tự động Chi đoàn và Liên chi đoàn từ thông tin đoàn viên nếu chưa có
        if (!data.unionCellId && member.unionCellId) {
            data.unionCellId = member.unionCellId;
        }
        
        // unionBranchId được lấy từ UnionCell
        if (!data.unionBranchId && member.UnionCell?.unionBranchId) {
            data.unionBranchId = member.UnionCell.unionBranchId;
        }
        
        return await UnionFeePayment.create(data);
    }

    static async getUnpaidMembers(period, { unionCellId, unionBranchId, search, page, limit } = {}) {
        if (!period) throw new ErrorResponse('Vui lòng cung cấp kỳ (period)', 400);
        const { page: p, limit: l, offset } = getPagination({ page, limit });

        const paidMemberIds = await UnionFeePayment.findAll({
            where: { period },
            attributes: ['unionMemberId']
        }).then(r => r.map(x => x.unionMemberId));

        const whereId = paidMemberIds.length
            ? { id: { [Op.notIn]: paidMemberIds } }
            : {};

        const memberWhere = {
            ...whereId,
            ...(unionCellId && { unionCellId }),
            ...buildSearchCondition(search, ['fullName', 'memberCode', 'phoneNumber'])
        };

        const cellInclude = {
            model: UnionCell,
            attributes: ['id', 'name', 'unionBranchId']
        };

        if (unionBranchId) {
            cellInclude.where = { unionBranchId };
        }

        const result = await UnionMember.findAndCountAll({
            where: memberWhere,
            include: [cellInclude],
            attributes: ['id', 'fullName', 'memberCode', 'phoneNumber', 'email'],
            order: [['fullName', 'ASC']],
            limit: l,
            offset
        });

        return formatPaginatedResponse(result, p, l);
    }

    static async delete(id) {
        const fee = await UnionFeePayment.findByPk(id);
        if (!fee) throw new ErrorResponse('Không tìm thấy bản ghi phí', 404);
        await fee.destroy();
        return { message: 'Đã xóa bản ghi thành công' };
    }

    static async updateStatus(id, { status, note }) {
        const fee = await UnionFeePayment.findByPk(id);
        if (!fee) throw new ErrorResponse('Không tìm thấy bản ghi phí', 404);
        
        fee.status = status;
        if (note) fee.note = note;
        
        return await fee.save();
    }
}

module.exports = FeeService;
