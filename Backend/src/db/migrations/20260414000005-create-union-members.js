const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('union_members', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      union_cell_id: {
        type: DataTypes.UUID,
        references: { model: 'union_cells', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      member_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      gender: {
        type: 'enum_union_members_gender',
        defaultValue: 'male'
      },
      identity_number: {
        type: DataTypes.STRING,
        unique: true
      },
      permanent_address: {
        type: DataTypes.TEXT
      },
      hometown: {
        type: DataTypes.TEXT
      },
      joined_date: {
        type: DataTypes.DATEONLY
      },
      official_date: {
        type: DataTypes.DATEONLY
      },
      member_card_number: {
        type: DataTypes.STRING,
        unique: true
      },
      joined_place: {
        type: DataTypes.STRING
      },
      education_level: {
        type: DataTypes.STRING
      },
      it_level: {
        type: DataTypes.STRING
      },
      language_level: {
        type: DataTypes.STRING
      },
      ethnicity: {
        type: DataTypes.STRING,
        defaultValue: 'Kinh'
      },
      religion: {
        type: DataTypes.STRING,
        defaultValue: 'Không'
      },
      member_type: {
        type: 'enum_union_members_memberType',
        defaultValue: 'STUDENT'
      },
      status: {
        type: 'enum_union_members_status',
        defaultValue: 'pending'
      },
      activity_status: {
        type: 'enum_union_members_activityStatus',
        defaultValue: 'active'
      },
      role_in_union: {
        type: 'enum_union_members_roleInUnion',
        defaultValue: 'member'
      },
      avatar: {
        type: DataTypes.STRING
      },
      social_work_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_activated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      activated_at: {
        type: DataTypes.DATE
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

    console.log('✅ UnionMembers table created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('union_members');
  }
};
