const asyncHandler = require('../utils/asyncHandler');
const StatisticService = require('../services/statisticService');

const statisticController = {
    getDashboard: asyncHandler(async (req, res) => {
        const stats = await StatisticService.getDashboardStats(req.user);
        res.status(200).json({ success: true, data: stats });
    }),

    getMembers: asyncHandler(async (req, res) => {
        const stats = await StatisticService.getMemberStats();
        res.status(200).json({ success: true, data: stats });
    }),

    getRankings: asyncHandler(async (req, res) => {
        const stats = await StatisticService.getRankings();
        res.status(200).json({ success: true, data: stats });
    })
};

module.exports = statisticController;
