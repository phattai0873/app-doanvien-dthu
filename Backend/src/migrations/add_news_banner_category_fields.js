/**
 * Script migration thủ công - thêm cột mới vào bảng news và news_categories
 * Chạy: node src/migrations/add_news_banner_category_fields.js
 * 
 * LƯU Ý: Nếu dự án đang dùng sequelize.sync({ alter: true }),
 * script này sẽ tự chạy khi server khởi động.
 * Chỉ cần chạy script này nếu muốn migrate thủ công.
 */

require('dotenv').config();
const { sequelize } = require('../configs/db');
const { QueryInterface, DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // ---- Bảng news: thêm cột bannerUrl ----
        const newsColumns = await queryInterface.describeTable('news');

        if (!newsColumns.bannerUrl) {
            await queryInterface.addColumn('news', 'bannerUrl', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ Đã thêm cột bannerUrl vào bảng news');
        } else {
            console.log('ℹ️  Cột bannerUrl đã tồn tại trong bảng news');
        }

        // ---- Bảng news: đổi content sang TEXT LONG ----
        // PostgreSQL không có TEXT LONG, TEXT là đủ lớn (không giới hạn)
        // Nên không cần thay đổi

        // ---- Bảng news_categories: thêm cột slug và isActive ----
        const catColumns = await queryInterface.describeTable('news_categories');

        if (!catColumns.slug) {
            await queryInterface.addColumn('news_categories', 'slug', {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            });
            console.log('✅ Đã thêm cột slug vào bảng news_categories');
        } else {
            console.log('ℹ️  Cột slug đã tồn tại trong bảng news_categories');
        }

        if (!catColumns.isActive) {
            await queryInterface.addColumn('news_categories', 'isActive', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            });
            console.log('✅ Đã thêm cột isActive vào bảng news_categories');
        } else {
            console.log('ℹ️  Cột isActive đã tồn tại trong bảng news_categories');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    }
}

migrate();
