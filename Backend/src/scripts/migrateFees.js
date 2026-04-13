const { 
    UnionFeePayment, FeePayment, FeeCollection, FeeItem, FeeCollectionScope, 
    UnionFeeType, sequelize 
} = require('../models');
const { connectDB } = require('../configs/db');

const migrateFees = async () => {
    console.log('🚀 Đang kết nối DB và đồng bộ bảng...');
    await connectDB();
    
    console.log('🚀 Bắt đầu di trú dữ liệu Đoàn phí...');
    const t = await sequelize.transaction();

    try {
        // 1. Lấy tất cả dữ liệu cũ
        const oldPayments = await UnionFeePayment.findAll();
        if (oldPayments.length === 0) {
            console.log('⚠️ Không có dữ liệu cũ để di trú.');
            return;
        }

        // 2. Phân loại theo năm (Bỏ qua các giá trị không hợp lệ)
        const years = [...new Set(oldPayments.map(p => {
            const y = parseInt(p.period);
            return isNaN(y) ? null : y.toString();
        }).filter(y => y !== null))];
        
        console.log(`📌 Tìm thấy dữ liệu hợp lệ của các năm: ${years.join(', ')}`);

        for (const year of years) {
            const validYear = parseInt(year);
            if (isNaN(validYear)) continue;

            const feeType = await UnionFeeType.findOne({ order: [['createdAt', 'ASC']] });

            // 3. Tạo Collection đại diện cho năm đó
            const [collection] = await FeeCollection.findOrCreate({
                where: { name: `Lịch sử năm ${validYear}`, periodType: 'YEAR' },
                defaults: {
                    feeTypeId: feeType.id,
                    amountPerUnit: 24000,
                    periodStart: `${validYear}-01-01`,
                    periodEnd: `${validYear}-12-31`,
                    isActive: false, 
                    allowPartialPayment: false
                },
                transaction: t
            });

            // 4. Tạo FeeItem "Đại diện năm"
            const [item] = await FeeItem.findOrCreate({
                where: { feeCollectionId: collection.id, period: validYear.toString() },
                defaults: {
                    label: `Cả năm ${validYear}`,
                    amount: 24000
                },
                transaction: t
            });

            // 5. Chuyển đổi từng bản ghi
            const paymentsOfYear = oldPayments.filter(p => parseInt(p.period) === validYear);
            let migratedCount = 0;

            for (const oldP of paymentsOfYear) {
                // Kiểm tra xem đã migrate chưa
                const exists = await FeePayment.findOne({
                    where: { unionMemberId: oldP.unionMemberId, feeItemId: item.id },
                    transaction: t
                });

                if (!exists) {
                    // Sanitize paidAt
                    let validPaidAt = oldP.paidAt;
                    if (!validPaidAt || isNaN(new Date(validPaidAt).getTime())) {
                        validPaidAt = new Date(); // Fallback về hiện tại nếu ngày nộp cũ bị lỗi
                    }

                    await FeePayment.create({
                        unionMemberId: oldP.unionMemberId,
                        feeItemId: item.id,
                        paymentTransactionId: oldP.paymentTransactionId,
                        status: 'PAID',
                        amountSnapshot: oldP.amount || 0,
                        paidAt: validPaidAt,
                        isLegacy: true,
                        note: oldP.note || `Di trú từ hệ thống cũ (Năm ${validYear})`
                    }, { transaction: t });
                    migratedCount++;
                }
            }
            console.log(`✅ Đã di trú ${migratedCount} bản ghi cho năm ${validYear}`);
        }

        await t.commit();
        console.log('🎉 Di trú hoàn tất thành công!');
    } catch (error) {
        await t.rollback();
        console.error('❌ Lỗi di trú:', error.message);
    }
};

migrateFees().then(() => process.exit());
