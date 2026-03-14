const { sequelize } = require('./src/configs/db');

async function checkConstraints() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = '"union_branches"'::regclass;
        `);
        console.log('Constraints on union_branches:');
        console.table(results);
    } catch (err) {
        console.error('Error checking constraints:', err.message);
    } finally {
        await sequelize.close();
    }
}

checkConstraints();
