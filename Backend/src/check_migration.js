require('dotenv').config();
const { sequelize } = require('./models');

async function check() {
    try {
        const [count] = await sequelize.query('SELECT count(*) FROM user_sensitive_data');
        console.log('COUNT in user_sensitive_data:', count[0].count);

        const [cols] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'union_members' AND column_name LIKE '%identityNumber%'
        `);
        console.log('Columns in union_members:', cols.map(c => c.column_name));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
