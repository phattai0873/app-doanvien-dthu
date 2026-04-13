const { 
    UnionMember, 
    UnionCell, 
    UnionBranch, 
    UnionFeePayment, 
    Activity, 
    ActivityParticipant,
    Meeting,
    sequelize 
} = require('../models');
const { Op } = require('sequelize');

class StatisticService {
    /**
     * Lấy số liệu tổng quan và thông tin chuyên sâu (Insights)
     */
    static async getDashboardStats(user) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            // 1. Tổng hợp số liệu cơ bản từ Database
            const totalMembers = await UnionMember.count({ where: { deletedAt: null } });
            const newMembersThisMonth = await UnionMember.count({
                where: { 
                    createdAt: { [Op.gte]: startOfMonth },
                    deletedAt: null
                }
            });
            const totalUnits = await UnionCell.count({ where: { deletedAt: null } });
            const totalBranches = await UnionBranch.count({ where: { deletedAt: null } });

            // 2. Tính toán xu hướng (Trend MoM) - Dựa trên dữ liệu thực tế
            const membersLastMonth = await UnionMember.count({
                where: { 
                    createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] },
                    deletedAt: null
                }
            });
            const memberGrowth = membersLastMonth === 0 ? (newMembersThisMonth > 0 ? 100 : 0) : Math.round(((newMembersThisMonth - membersLastMonth) / membersLastMonth) * 100);

            // 3. Phân tích Hoạt động gần đây (Dữ liệu từ bảng activities)
            const activeActivities = await Activity.count({ 
                where: { 
                    status: { [Op.in]: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
                    deletedAt: null
                } 
            });

            // 4. Phân tích Đoàn phí (Dữ liệu thực tế từ bảng union_fee_payments)
            const currentYear = now.getFullYear();
            const totalRevenue = await UnionFeePayment.sum('amount', { 
                where: { period: currentYear.toString() } 
            }) || 0;

            // 5. SMART INSIGHTS - TẤT CẢ TỪ DATABASE
            const alerts = [];
            
            // Insight 1: Đơn vị KHÔNG có hoạt động trong 30 ngày (Dữ liệu thực)
            const inactiveCells = await sequelize.query(`
                SELECT c.id, c.name
                FROM union_cells c
                LEFT JOIN activities a ON c.id = a."organizedByCellId" AND a."createdAt" >= NOW() - INTERVAL '30 days' AND a."deletedAt" IS NULL
                WHERE c."deletedAt" IS NULL
                GROUP BY c.id, c.name
                HAVING COUNT(a.id) = 0
                LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            if (inactiveCells.length > 0) {
                alerts.push({
                    type: 'warning',
                    title: 'Chi đoàn ít hoạt động',
                    message: `${inactiveCells.length} chi đoàn chưa tổ chức hoạt động nào trong tháng qua.`,
                    data: inactiveCells
                });
            }

            // Insight 2: Đơn vị nộp phí dưới 30% (Dữ liệu thực)
            const lowFeeCells = await sequelize.query(`
                SELECT c.name, COUNT(m.id) as total, COUNT(f.id) as paid
                FROM union_cells c
                JOIN union_members m ON c.id = m."unionCellId" AND m."deletedAt" IS NULL
                LEFT JOIN union_fee_payments f ON m.id = f.union_member_id AND f.period = '${currentYear}'
                WHERE c."deletedAt" IS NULL
                GROUP BY c.id, c.name
                HAVING COUNT(m.id) > 0 AND (COUNT(f.id) * 100.0 / COUNT(m.id)) < 30
                LIMIT 3
            `, { type: sequelize.QueryTypes.SELECT });

            if (lowFeeCells.length > 0) {
                alerts.push({
                    type: 'danger',
                    title: 'Tiến độ thu phí chậm',
                    message: `Có ${lowFeeCells.length} đơn vị có tỷ lệ hoàn thành nộp phí năm ${currentYear} thấp (< 30%).`,
                    data: lowFeeCells
                });
            }

            // Insight 3: Chi đoàn chưa sinh hoạt định kỳ trong tháng (Dữ liệu thực từ bảng meetings level CELL)
            const noMeetingCells = await sequelize.query(`
                SELECT c.id, c.name
                FROM union_cells c
                LEFT JOIN meetings m ON c.id = m."organizerCellId" 
                    AND m."meetingTime" >= '${startOfMonth.toISOString()}' 
                    AND m.status = 'COMPLETED'
                    AND m."deletedAt" IS NULL
                WHERE c."deletedAt" IS NULL AND c.status = 'active'
                GROUP BY c.id, c.name
                HAVING COUNT(m.id) = 0
                LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            if (noMeetingCells.length > 0) {
                alerts.push({
                    type: 'warning',
                    title: 'Chưa sinh hoạt định kỳ',
                    message: `Có ${noMeetingCells.length} chi đoàn chưa cập nhật biên bản sinh hoạt định kỳ tháng này.`,
                    data: noMeetingCells
                });
            }

            return {
                summary: {
                    totalMembers,
                    newMembersThisMonth,
                    memberGrowth,
                    totalUnits,
                    totalBranches,
                    activeActivities,
                    totalRevenue: parseFloat(totalRevenue)
                },
                alerts
            };
        } catch (error) {
            console.error('[DashboardStats] Error:', error);
            throw error;
        }
    }

    /**
     * Thống kê Đoàn viên chi tiết (Database queries)
     */
    static async getMemberStats() {
        try {
            const genderStats = await UnionMember.findAll({
                attributes: ['gender', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                where: { deletedAt: null },
                group: ['gender'],
                raw: true
            });

            const ethnicityStats = await UnionMember.findAll({
                attributes: ['ethnicity', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                where: { deletedAt: null },
                group: ['ethnicity'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: 5,
                raw: true
            });

            const branchStats = await sequelize.query(`
                SELECT b.name, COUNT(m.id) as "memberCount"
                FROM union_branches b
                LEFT JOIN union_cells c ON b.id = c."unionBranchId" AND c."deletedAt" IS NULL
                LEFT JOIN union_members m ON c.id = m."unionCellId" AND m."deletedAt" IS NULL
                WHERE b."deletedAt" IS NULL
                GROUP BY b.id, b.name
                ORDER BY "memberCount" DESC
            `, { type: sequelize.QueryTypes.SELECT });

            return {
                gender: genderStats.map(s => ({ gender: s.gender, count: parseInt(s.count) })),
                ethnicity: ethnicityStats.map(s => ({ ethnicity: s.ethnicity, count: parseInt(s.count) })),
                byBranch: branchStats.map(s => ({ name: s.name, memberCount: parseInt(s.memberCount) }))
            };
        } catch (error) {
            console.error('[MemberStats] Error:', error);
            throw error;
        }
    }

    /**
     * Xếp hạng thi đua (Database queries)
     */
    static async getRankings() {
        try {
            const topMembers = await sequelize.query(`
                SELECT m."fullName", m."memberCode", c.name as "cellName", m."socialWorkDays"
                FROM union_members m
                JOIN union_cells c ON m."unionCellId" = c.id
                WHERE m."deletedAt" IS NULL
                ORDER BY m."socialWorkDays" DESC NULLS LAST
                LIMIT 10
            `, { type: sequelize.QueryTypes.SELECT });

            const topCells = await sequelize.query(`
                SELECT c.name, COUNT(m.id) as "memberCount", SUM(COALESCE(m."socialWorkDays", 0)) as "totalWorkDays"
                FROM union_cells c
                JOIN union_members m ON c.id = m."unionCellId"
                WHERE c."deletedAt" IS NULL AND m."deletedAt" IS NULL
                GROUP BY c.id, c.name
                ORDER BY "totalWorkDays" DESC
                LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            return {
                topMembers,
                topCells
            };
        } catch (error) {
            console.error('[Rankings] Error:', error);
            throw error;
        }
    }
}

module.exports = StatisticService;
