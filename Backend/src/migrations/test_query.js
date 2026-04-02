require('dotenv').config();
const { sequelize } = require('../configs/db');

async function test() {
    try {
        await sequelize.authenticate();
        // Try without any quotes first
        const [rows] = await sequelize.query('SELECT userId, email, phoneNumber FROM union_members LIMIT 1');
        console.log('Success without quotes:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error without quotes:', error.message);
        try {
            // Try with quotes
            const [rows] = await sequelize.query('SELECT "userId", "email", "phoneNumber" FROM "union_members" LIMIT 1');
            console.log('Success with quotes:', rows);
            process.exit(0);
        } catch (error2) {
            console.error('Error with quotes:', error2.message);
            process.exit(1);
        }
    }
}
test();
