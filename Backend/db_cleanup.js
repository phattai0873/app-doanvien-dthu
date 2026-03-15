const { sequelize } = require('./src/configs/db');

async function cleanup() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB for cleanup.');

        const tables = ['union_branches', 'union_cells', 'union_members'];
        
        for (const table of tables) {
            console.log(`🧹 Cleaning up ${table}...`);
            
            // Get all constraints for the table
            const [constraints] = await sequelize.query(`
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = '"${table}"'::regclass;
            `);

            for (const row of constraints) {
                const name = row.conname;
                // Look for code_key with suffixes or foreign keys that might be problematic
                if (name.includes('_code_key') || 
                    name.includes('_memberCode_key') || 
                    name.includes('_identityNumber_key') || 
                    name.includes('_memberCardNumber_key') ||
                    name.includes('secretaryId_fkey') || 
                    name.includes('deputySecretaryId_fkey')) {
                    
                    console.log(`   - Dropping constraint: ${name}`);
                    await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${name}"`);
                }
            }
        }

        console.log('✅ Cleanup finished. Please restart only ONE backend process.');
    } catch (err) {
        console.error('❌ Cleanup failed:', err.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

cleanup();
