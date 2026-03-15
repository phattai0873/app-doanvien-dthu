const NotificationService = require('./src/services/notificationService');
const { User, UnionMember, Role } = require('./src/models');
const { sequelize } = require('./src/configs/db');

async function test() {
    try {
        await sequelize.authenticate();
        
        // Simulating a normal user (memberUser1 from seed)
        const user = await User.findOne({ 
            where: { username: 'tran_thi_b' },
            include: [{ model: Role }, { model: UnionMember }]
        });
        
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        
        console.log('Testing for user:', user.username);
        console.log('User Member ID:', user.UnionMember?.id);
        console.log('User Branch ID:', user.UnionMember?.unionBranchId);
        
        const result = await NotificationService.getAll({ userId: user.id });
        console.log('Inbox Result count:', result.pagination.total);
        result.data.forEach(n => {
            console.log(`- ${n.title} (${n.targetType})`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
