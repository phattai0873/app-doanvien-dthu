require('dotenv').config();
const { sequelize } = require('../configs/db');

async function check() {
    try {
        await sequelize.authenticate();
        const queryInterface = sequelize.getQueryInterface();
        const columns = await queryInterface.describeTable('union_members');
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
check();
