const { sequelize } = require('../configs/db');

async function resetFeeTables() {
    try {
        console.log('🔄 Đang bắt đầu quá trình Reset bảng Đoàn phí...');
        
        // Disable foreign key checks for dropping
        await sequelize.query('DROP TABLE IF EXISTS "union_fee_payments" CASCADE;');
        console.log('✅ Đã xóa bảng "union_fee_payments"');
        
        await sequelize.query('DROP TABLE IF EXISTS "payment_transactions" CASCADE;');
        console.log('✅ Đã xóa bảng "payment_transactions"');
        
        console.log('🚀 Reset hoàn tất. Bạn có thể khởi động lại Backend bây giờ.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi reset bảng:', error);
        process.exit(1);
    }
}

resetFeeTables();
