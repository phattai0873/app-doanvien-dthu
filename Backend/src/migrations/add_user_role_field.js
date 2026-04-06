require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        const tableInfo = await queryInterface.describeTable('users');

        if (!tableInfo.role) {
            await queryInterface.addColumn('users', 'role', {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'MEMBER'
            });
            console.log('✅ Đã thêm cột role vào bảng users');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
