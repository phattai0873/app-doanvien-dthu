const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Bảng UnionPositions (Danh mục chức vụ)
    await queryInterface.createTable('union_positions', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      level: { type: DataTypes.STRING }, // SCHOOL, BRANCH, CELL
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    // 2. Bảng UnionMemberPositions (Bảng liên kết Nhiều - Nhiều có thêm thuộc tính)
    await queryInterface.createTable('union_member_positions', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      union_member_id: {
        type: DataTypes.UUID,
        references: { model: 'union_members', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      union_position_id: {
        type: DataTypes.UUID,
        references: { model: 'union_positions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      union_branch_id: { type: DataTypes.UUID },
      union_cell_id: { type: DataTypes.UUID },
      is_main: { type: DataTypes.BOOLEAN, defaultValue: false },
      term: { type: DataTypes.STRING },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    console.log('✅ Position tables created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('union_member_positions');
    await queryInterface.dropTable('union_positions');
  }
};
