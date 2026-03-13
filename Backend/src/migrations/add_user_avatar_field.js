/**
 * Script migration thủ công - thêm cột avatar vào bảng users
 * Chạy: node src/migrations/add_user_avatar_field.js
 */

require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // ---- Bảng users: thêm cột avatar ----
        const userColumns = await queryInterface.describeTable('users');

        if (!userColumns.avatar) {
            await queryInterface.addColumn('users', 'avatar', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ Đã thêm cột avatar vào bảng users');
        } else {
            console.log('ℹ️ Cột avatar đã tồn tại trong bảng users');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    }
}

migrate();
