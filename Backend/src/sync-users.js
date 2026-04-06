require('dotenv').config();
const { sequelize } = require('./configs/db');
const { UnionMember } = require('./models');
const UnionMemberService = require('./services/unionMemberService');

async function syncAll() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const members = await UnionMember.findAll({ attributes: ['id', 'fullName'] });
        console.log(`🔄 Syncing roles for ${members.length} members...`);

        for (const m of members) {
            try {
                await UnionMemberService._syncUserSystemSpecs(m.id);
                process.stdout.write('.');
            } catch (e) {
                console.error(`\n❌ Error syncing member ${m.id}:`, e.message);
            }
        }

        console.log('\n✅ All users synced successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Sync failed:', e);
        process.exit(1);
    }
}

syncAll();
