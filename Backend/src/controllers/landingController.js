const { LandingConfig } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const landingController = {
    // Lấy tất cả cấu hình (Public)
    getConfigs: asyncHandler(async (req, res) => {
        const configs = await LandingConfig.findAll();
        // Chuyển đổi sang dạng object { key: value } để frontend dễ dùng
        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        
        res.status(200).json({ success: true, data: configMap });
    }),

    // Cập nhật hoặc tạo mới cấu hình (Admin)
    updateConfig: asyncHandler(async (req, res) => {
        const { key, value, description } = req.body;
        
        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: 'Key and Value are required' });
        }

        let config = await LandingConfig.findOne({ where: { key } });
        
        if (config) {
            config.value = value;
            if (description) config.description = description;
            await config.save();
        } else {
            config = await LandingConfig.create({ key, value, description });
        }

        res.status(200).json({ success: true, data: config });
    }),

    // Khởi tạo các cấu hình mặc định (Dùng 1 lần)
    seedConfigs: asyncHandler(async (req, res) => {
        const defaultConfigs = [
            {
                key: 'hero_section',
                value: {
                    title: 'Kết nối Đoàn Viên Trong tầm tay bạn',
                    subtitle: 'Ứng dụng Quản lý Đoàn viên 4.0',
                    description: 'Nền tảng hiện đại giúp quản lý, tương tác và nắm bắt các thông tin Đoàn một cách nhanh chóng, hiệu quả và minh bạch nhất.'
                }
            },
            {
                key: 'app_links',
                value: {
                    ios: '#',
                    android: '#'
                }
            }
        ];

        for (const conf of defaultConfigs) {
            await LandingConfig.findOrCreate({
                where: { key: conf.key },
                defaults: conf
            });
        }

        res.status(200).json({ success: true, message: 'Default configurations seeded' });
    })
};

module.exports = landingController;
