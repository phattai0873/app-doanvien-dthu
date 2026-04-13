require('dotenv').config();
const { sequelize } = require('./configs/db');

async function rename() {
    try {
        await sequelize.query('ALTER TABLE union_members RENAME COLUMN "identityNumber" TO "deprecated_identityNumber"');
        console.log('✅ Renamed successfully');
        process.exit(0);
    } catch (e) {
        console.error('❌ Rename failed:', e.message);
        process.exit(1);
    }
}
rename();
