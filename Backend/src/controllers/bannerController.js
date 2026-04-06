const { Banner } = require('../models');
const path = require('path');
const fs = require('fs');

/**
 * Lấy tất cả banner
 * GET /api/banners
 */
exports.getAllBanners = async (req, res, next) => {
    try {
        const { activeOnly, onlyDeleted } = req.query;
        const where = activeOnly === 'true' ? { isActive: true } : {};

        const queryOptions = {
            where,
            order: onlyDeleted === 'true' ? [['deletedAt', 'DESC']] : [['order', 'ASC'], ['createdAt', 'DESC']]
        };

        if (onlyDeleted === 'true') {
            queryOptions.paranoid = false;
            where.deletedAt = { [require('sequelize').Op.ne]: null };
        }

        const banners = await Banner.findAll(queryOptions);

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

        await banner.destroy();

        res.status(200).json({
            success: true,
            message: 'Đã chuyển banner vào thùng rác'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Khôi phục banner
 */
exports.restoreBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByPk(req.params.id, { paranoid: false });
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner trong thùng rác' });
        }

        await banner.restore();

        res.status(200).json({
            success: true,
            message: 'Đã khôi phục banner thành công',
            data: banner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Xóa vĩnh viễn banner và file ảnh
 */
exports.forceDeleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByPk(req.params.id, { paranoid: false });
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        }

        // Xóa file vật lý
        if (banner.imageUrl) {
            const filePath = path.join(__dirname, '../../../Backend', banner.imageUrl); // Sửa lại path cho đúng cấp
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await banner.destroy({ force: true });

        res.status(200).json({
            success: true,
            message: 'Đã xóa vĩnh viễn banner và tập tin ảnh'
        });
    } catch (error) {
        next(error);
    }
};
