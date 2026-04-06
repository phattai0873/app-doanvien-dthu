const { sequelize } = require('../configs/db');
const { QueryTypes } = require('sequelize');

/**
 * Script này thực hiện:
 * 1. Thêm cột 'deletedAt' cho tất cả các bảng chính (loại trừ các bảng trung gian).
 * 2. Tạo Index cho 'deletedAt'.
 * 3. Chuyển đổi các UNIQUE constraint sang Partial Unique Index (WHERE "deletedAt" IS NULL).
 */

const tables = [
  'users', 'union_positions', 'union_member_histories', 'union_members', 
  'union_fee_types', 'union_fee_payments', 'union_cells', 'union_branches', 
  'roles', 'quiz_questions', 'quiz_options', 'quiz_exams', 'quiz_attempts', 
  'permissions', 'payment_transactions', 'notifications', 'news_categories', 
  'news', 'meetings', 'LandingConfigs', 'document_categories', 'documents', 
  'cell_meeting_locations', 'cell_meetings', 'banners', 'bank_settings', 
  'audit_logs', 'attendance', 'activities'
];

// Map của table -> các cột đã được đánh unique trong Model
const uniqueFieldsMap = {
  'users': ['username', 'email', 'phoneNumber'],
  'union_members': ['memberCode', 'identityNumber', 'memberCardNumber'],
  'union_branches': ['code'],
  'union_cells': ['code'],
  'roles': ['name'],
  'permissions': ['code'],
  'news_categories': ['name'],
  'union_fee_types': ['name'],
  'LandingConfigs': ['key'],
};

async function migrate() {
  console.log('🚀 Bắt đầu quá trình Migration Soft Delete...');
  
  try {
    // 1. Thêm cột deletedAt cho tất cả các bảng
    for (const table of tables) {
      console.log(`- Xử lý bảng: ${table}...`);
      
      try {
        // Thêm cột deletedAt
        await sequelize.query(`
          ALTER TABLE "${table}" 
          ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE NULL
        `);

        // Thêm Index cho deletedAt
        const indexName = `idx_${table.toLowerCase()}_deletedat`;
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ("deletedAt")
        `);
      } catch (err) {
        console.warn(`  ⚠️  Không thể xử lý bảng ${table}: ${err.message}`);
      }
    }

    // 2. Xử lý UNIQUE Constraints
    console.log('\n🔄 Chuyển đổi UNIQUE Constraints sang Partial Indexes...');
    for (const [table, fields] of Object.entries(uniqueFieldsMap)) {
      for (const field of fields) {
        console.log(`  > ${table}.${field}`);

        try {
          // Tìm tên constraint UNIQUE hiện tại trong PostgreSQL
          const constraints = await sequelize.query(`
            SELECT con.conname 
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = '${table}' 
            AND (con.conname LIKE '%${field}%key' OR con.conname LIKE '%${table.toLowerCase()}_${field.toLowerCase()}_key%')
          `, { type: QueryTypes.SELECT });

          for (const conn of constraints) {
            console.log(`    * Đang xóa Constraint: ${conn.conname}`);
            await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${conn.conname}" CASCADE`);
          }

          // Xử lý các Index Unique do Sequelize tạo trực tiếp (không thông qua constraint)
          const oldIndexName = `${table.toLowerCase()}_${field.toLowerCase()}_key`;
          await sequelize.query(`DROP INDEX IF EXISTS "${oldIndexName}" CASCADE`);

          // Tạo Partial Unique Index mới
          const newIndexName = `unique_${table.toLowerCase()}_${field.toLowerCase()}_active`;
          await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "${newIndexName}" 
            ON "${table}" ("${field}") 
            WHERE "deletedAt" IS NULL
          `);
          console.log(`    * Đã tạo Partial Index: ${newIndexName}`);
        } catch (err) {
          console.warn(`    ⚠️  Lỗi khi xử lý unique cho ${table}.${field}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Quá trình Migration hoàn tất thành công!');
  } catch (error) {
    console.error('\n❌ Lỗi hệ thống trong quá trình Migration:', error);
  } finally {
    process.exit();
  }
}

migrate();
