const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      token_device: {
        type: DataTypes.STRING
      },
      last_login: {
        type: DataTypes.DATE
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      refresh_token_hash: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      union_branch_id: {
        type: DataTypes.UUID,
        allowNull: true
        // Khóa ngoại sẽ được thêm sau hoặc để lỏng để tránh quan hệ vòng lúc init
      },
      union_cell_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'MEMBER'
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

    // Bảng phụ UserRoles
    await queryInterface.createTable('UserRoles', {
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      UserId: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      },
      RoleId: {
        type: DataTypes.UUID,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      }
    });

    console.log('✅ Users table and UserRoles created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('UserRoles');
    await queryInterface.dropTable('users');
  }
};
