const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Bảng UnionFeeTypes
    await queryInterface.createTable('union_fee_types', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    // 2. Bảng PaymentTransactions
    await queryInterface.createTable('payment_transactions', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      union_member_id: {
        type: DataTypes.UUID,
        references: { model: 'union_members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      union_fee_type_id: {
        type: DataTypes.UUID,
        references: { model: 'union_fee_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      total_amount: { type: DataTypes.DECIMAL(15, 2) },
      status: {
        type: 'enum_payment_transactions_status',
        defaultValue: 'PENDING'
      },
      payment_provider: {
        type: 'enum_payment_transactions_paymentProvider',
        defaultValue: 'CASH'
      },
      transaction_code: { type: DataTypes.STRING, unique: true },
      paid_at: { type: DataTypes.DATE },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    console.log('✅ Financial tables created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('payment_transactions');
    await queryInterface.dropTable('union_fee_types');
  }
};
