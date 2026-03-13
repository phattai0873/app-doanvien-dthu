require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        const newsColumns = await queryInterface.describeTable('news');

        if (!newsColumns.scope) {
            // Sequelize ENUM might need special handling if it doesn't exist
            // For Postgres, usually it's better to add as a string if ENUM type isn't defined yet
            // But if we're using sync() on server, we should be fine.
            // Let's use STRING first to be safe, then let sync() handle it if needed.
            await queryInterface.addColumn('news', 'scope', {
                type: DataTypes.ENUM('Tỉnh', 'Trường'),
                allowNull: false,
                defaultValue: 'Trường'
            });
            console.log('✅ Đã thêm cột scope vào bảng news');
        } else {
            console.log('ℹ️  Cột scope đã tồn tại trong bảng news');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
