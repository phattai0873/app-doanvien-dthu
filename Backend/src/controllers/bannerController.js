const { Banner } = require('../models');
const path = require('path');
const fs = require('fs');

/**
 * Lấy tất cả banner
 * GET /api/banners
 */
exports.getAllBanners = async (req, res, next) => {
    try {
        const { activeOnly } = req.query;
        const where = activeOnly === 'true' ? { isActive: true } : {};

        const banners = await Banner.findAll({
            where,
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: banners
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Thêm banner mới
 * POST /api/banners
 */
exports.createBanner = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload ảnh banner' });
        }

        const { title, linkUrl, order } = req.body;
        const imageUrl = `/uploads/banners/${req.file.filename}`;

        const banner = await Banner.create({
            title,
            imageUrl,
            linkUrl,
            order: order || 0
        });

        res.status(201).json({
            success: true,
            message: 'Đã thêm banner thành công',
            data: banner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cập nhật trạng thái active
 * PATCH /api/banners/:id/toggle
 */
exports.toggleBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.status(200).json({
            success: true,
            message: `Đã ${banner.isActive ? 'bật' : 'tắt'} banner`,
            data: banner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Xóa banner
 * DELETE /api/banners/:id
 */
exports.deleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        }

        // Xóa file vật lý
        const filePath = path.join(__dirname, '../../', banner.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await banner.destroy();

        res.status(200).json({
            success: true,
            message: 'Đã xóa banner thành công'
        });
    } catch (error) {
        next(error);
    }
};
