require('dotenv').config();
const { UnionMember, UserSensitiveData, sequelize } = require('./models');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Tạo thử một bản ghi nhạy cảm
        const member = await UnionMember.findOne();
        if (!member) {
            console.log('❌ Không tìm thấy member nào để test');
            return;
        }

        console.log(`Testing with member: ${member.fullName} (${member.id})`);

        // Tìm hoặc tạo sensitive data
        let sensitiveData = await UserSensitiveData.findOne({ where: { unionMemberId: member.id } });
        
        if (!sensitiveData) {
            sensitiveData = UserSensitiveData.build({ unionMemberId: member.id });
        }

        const testCCCD = '012345678912';
        console.log(`\n--- Test Mã hóa ---`);
        console.log(`Input: ${testCCCD}`);
        
        sensitiveData.setIdentityNumber(testCCCD);
        await sensitiveData.save();

        console.log(`Stored in DB:`);
        console.log(`- Encrypted: ${sensitiveData.identityNumberEncrypted}`);
        console.log(`- IV: ${sensitiveData.iv}`);
        console.log(`- AuthTag: ${sensitiveData.authTag}`);

        console.log(`\n--- Test Giải mã ---`);
        const decrypted = sensitiveData.getDecryptedIdentityNumber();
        console.log(`Result: ${decrypted}`);

        if (decrypted === testCCCD) {
            console.log('✅ Giải mã chính xác 100%!');
        } else {
            console.log('❌ Lỗi giải mã dữ liệu!');
        }

        // 2. Kiểm tra lại dữ liệu vừa lưu
        const savedData = await UserSensitiveData.findOne({ where: { unionMemberId: member.id } });
        console.log(`\n--- Test Truy vấn lại ---`);
        console.log(`Decrypted after refetch: ${savedData.getDecryptedIdentityNumber()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during verification:', error);
        process.exit(1);
    }
}

verify();
