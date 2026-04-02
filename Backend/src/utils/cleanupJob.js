const { News, User, UnionMember, Document, QuizExam, Banner, Meeting } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const CLEANUP_DAYS = 30;

/**
 * Script dọn dẹp các bản ghi đã xóa mềm quá 30 ngày và xóa file vật lý tương ứng.
 */
async function cleanupDeletedRecords() {
    console.log('--- Bắt đầu tiến trình dọn dẹp định kỳ ---');
    const thresholdDate = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);

    try {
        // 1. Dọn dẹp News
        const oldNews = await News.findAll({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            paranoid: false
        });
        for (const item of oldNews) {
            if (item.thumbnail) {
                const fullPath = path.join(__dirname, '../../', item.thumbnail);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            await item.destroy({ force: true });
            console.log(`- Xóa vĩnh viễn bài viết: ${item.title}`);
        }

        // 2. Dọn dẹp User Avatars
        const oldUsers = await User.findAll({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            paranoid: false
        });
        for (const user of oldUsers) {
            if (user.avatar) {
                const fullPath = path.join(__dirname, '../../', user.avatar);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            await user.destroy({ force: true });
            console.log(`- Xóa vĩnh viễn tài khoản: ${user.username}`);
        }

        // 3. Dọn dẹp Documents
        const oldDocs = await Document.findAll({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            paranoid: false
        });
        for (const doc of oldDocs) {
            if (doc.filePath) {
                const fullPath = path.join(__dirname, '../../', doc.filePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            await doc.destroy({ force: true });
        }

        // 4. Banners
        const oldBanners = await Banner.findAll({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            paranoid: false
        });
        for (const banner of oldBanners) {
            if (banner.imageUrl) {
                const fullPath = path.join(__dirname, '../../', banner.imageUrl);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            }
            await banner.destroy({ force: true });
        }

        // 5. Quizzes & Meetings (Chỉ xóa bản ghi)
        await QuizExam.destroy({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            force: true
        });
        await Meeting.destroy({
            where: { deletedAt: { [Op.lt]: thresholdDate } },
            force: true
        });

        console.log('--- Hoàn tất dọn dẹp ---');
    } catch (error) {
        console.error('Lỗi khi dọn dẹp:', error);
    }
}

module.exports = cleanupDeletedRecords;
