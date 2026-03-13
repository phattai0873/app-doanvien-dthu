/**
 * Script migration thủ công - thêm cột thumbnail vào bảng quiz_exams
 * Chạy: node src/migrations/add_quiz_thumbnail_field.js
 */

require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // ---- Bảng quiz_exams: thêm cột thumbnail ----
        const quizExamColumns = await queryInterface.describeTable('quiz_exams');

        if (!quizExamColumns.thumbnail) {
            await queryInterface.addColumn('quiz_exams', 'thumbnail', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ Đã thêm cột thumbnail vào bảng quiz_exams');
        } else {
            console.log('ℹ️ Cột thumbnail đã tồn tại trong bảng quiz_exams');
        }

        console.log('\n🎉 Migration hoàn tất!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    }
}

migrate();
