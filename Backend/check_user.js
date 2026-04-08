const { User, UnionMember } = require('./src/models');
const { connectDB } = require('./src/configs/db');

async function check() {
    await connectDB();
    const users = await User.findAll({
        include: [{ model: UnionMember }]
    });
    
    console.log('--- USER DIAGNOSTIC ---');
    users.forEach(u => {
        console.log(`User: ${u.username} (ID: ${u.id})`);
        console.log(`  -> Member: ${u.UnionMember ? u.UnionMember.fullName + ' (ID: ' + u.UnionMember.id + ')' : 'NONE'}`);
    });
    process.exit();
}

check();
