const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Bảng UnionBranches
    await queryInterface.createTable('union_branches', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      union_level: {
        type: DataTypes.STRING
      },
      office_address: {
        type: DataTypes.STRING
      },
      phone_number: {
        type: DataTypes.STRING
      },
      status: {
        type: 'enum_union_branches_status', // Sử dụng Type đã tạo ở 01
        defaultValue: 'active'
      },
      term_start_year: {
        type: DataTypes.INTEGER
      },
      term_end_year: {
        type: DataTypes.INTEGER
      },
      logo_url: {
        type: DataTypes.STRING
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      secretary_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      deputy_secretary_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deleted_at: {
        type: DataTypes.DATE
      }
    });

    // 2. Bảng UnionCells
    await queryInterface.createTable('union_cells', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      union_branch_id: {
        type: DataTypes.UUID,
        references: { model: 'union_branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: 'enum_union_branches_status',
        defaultValue: 'active'
      },
      secretary_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      deputy_secretary_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deleted_at: {
        type: DataTypes.DATE
      }
    });

    console.log('✅ Branches and Cells tables created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('union_cells');
    await queryInterface.dropTable('union_branches');
  }
};
