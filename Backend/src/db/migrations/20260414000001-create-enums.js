const { Sequelize } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Enum cho UnionBranch
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_branches_status AS ENUM ('active', 'inactive');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Enum cho UnionMember
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_members_gender AS ENUM ('male', 'female');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_members_status AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_members_activityStatus AS ENUM ('active', 'transferred', 'graduated', 'paused');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_members_roleInUnion AS ENUM ('member', 'vice_secretary', 'secretary', 'commissioner');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_union_members_memberType AS ENUM ('STUDENT', 'STAFF', 'TEACHER', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 3. Enum cho PaymentTransaction
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_payment_transactions_paymentProvider AS ENUM ('CASH', 'BANK_TRANSFER', 'MOMO', 'VNPAY', 'ZALOPAY');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_payment_transactions_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 4. Enum cho News
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_news_status AS ENUM ('DRAFT', 'PUBLISHED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Dùng chung cho News và Activity
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_app_level AS ENUM ('SCHOOL', 'BRANCH', 'CELL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_news_scope AS ENUM ('Trường', 'Tỉnh');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 5. Enum cho Activity
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_activities_type AS ENUM ('Sinh hoạt', 'Hoạt động');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_activities_category AS ENUM ('VOLUNTARY', 'ACADEMIC', 'SPORTS', 'CULTURE', 'POLITICAL', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_activities_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    
    console.log('✅ All ENUM types created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    // Gỡ bỏ các type khi rollback (Cẩn thận: DB production thường không xóa type nếu đang có bảng dùng)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_branches_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_members_gender CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_members_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_members_activityStatus CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_members_roleInUnion CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_union_members_memberType CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_payment_transactions_paymentProvider CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_payment_transactions_status CASCADE;');
  }
};
