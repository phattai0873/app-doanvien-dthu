/**
 * Migration script - Move email and phoneNumber from UnionMember to User
 * Run: node src/migrations/move_member_fields.js
 */

require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // 1. Add fields to users table if not exists
        const userColumns = await queryInterface.describeTable('users');
        if (!userColumns.email) {
            await queryInterface.addColumn('users', 'email', {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            });
            console.log('✅ Đã thêm cột email vào bảng users');
        } else {
            console.log('ℹ️ Cột email đã tồn tại trong bảng users');
        }

        if (!userColumns.phoneNumber) {
            await queryInterface.addColumn('users', 'phoneNumber', {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            });
            console.log('✅ Đã thêm cột phoneNumber vào bảng users');
        } else {
            console.log('ℹ️ Cột phoneNumber đã tồn tại trong bảng users');
        }

        // 2. Migrate data
        console.log('⏳ Đang di chuyển dữ liệu...');
        const [members] = await sequelize.query(`
            SELECT "userId", "email", "phoneNumber" 
            FROM "union_members" 
            WHERE "email" IS NOT NULL OR "phoneNumber" IS NOT NULL
        `);

        console.log(`Found ${members.length} members to migrate.`);

        for (const member of members) {
            // Update User with data from UnionMember if User field is currently null
            await sequelize.query(`
                UPDATE "users" 
                SET 
                    "email" = COALESCE("email", :email),
                    "phoneNumber" = COALESCE("phoneNumber", :phoneNumber)
                WHERE "id" = :userId
            `, {
                replacements: {
                    email: member.email,
                    phoneNumber: member.phoneNumber,
                    userId: member.userId
                }
            });
        }

        console.log('✅ Dữ liệu đã được di chuyển thành công');

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    }
}

migrate();
