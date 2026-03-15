const { Notification } = require('./src/models');
const { sequelize } = require('./src/configs/db');

async function check() {
    try {
        await sequelize.authenticate();
        const notifs = await Notification.findAll();
        console.log('Total notifications:', notifs.length);
        notifs.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Status: ${n.status} | Target: ${n.targetType} | TargetID: ${n.targetId} | senderBranchId: ${n.senderBranchId}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
