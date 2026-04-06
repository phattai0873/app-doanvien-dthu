require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        const tableInfo = await queryInterface.describeTable('union_member_positions');

        if (!tableInfo.union_branch_id) {
            await queryInterface.addColumn('union_member_positions', 'union_branch_id', {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'union_branches',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            console.log('✅ Đã thêm cột union_branch_id vào bảng union_member_positions');
        }

        if (!tableInfo.union_cell_id) {
            await queryInterface.addColumn('union_member_positions', 'union_cell_id', {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'union_cells',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            console.log('✅ Đã thêm cột union_cell_id vào bảng union_member_positions');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
