const { User, Role } = require('./src/models');
const { sequelize } = require('./src/configs/db');

async function check() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ 
            where: { username: 'admin' },
            include: [{ model: Role }]
        });
        console.log('User:', user.username);
        console.log('Roles:', user.Roles.map(r => r.code));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

check();
