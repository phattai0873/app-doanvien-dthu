const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // 1. Bảng NewsCategories
    await queryInterface.createTable('news_categories', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    // 2. Bảng News
    await queryInterface.createTable('news', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      summary: { type: DataTypes.TEXT },
      content: { type: DataTypes.TEXT, allowNull: false },
      thumbnail_url: { type: DataTypes.STRING },
      status: { type: 'enum_news_status', defaultValue: 'DRAFT' },
      level: { type: 'enum_app_level', defaultValue: 'SCHOOL' },
      category_id: {
        type: DataTypes.UUID,
        references: { model: 'news_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      author_id: { type: DataTypes.UUID },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    // 3. Bảng Activities
    await queryInterface.createTable('activities', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      start_date: { type: DataTypes.DATE, allowNull: false },
      end_date: { type: DataTypes.DATE, allowNull: false },
      location: { type: DataTypes.STRING },
      type: { type: 'enum_activities_type', defaultValue: 'Hoạt động' },
      level: { type: 'enum_app_level', defaultValue: 'BRANCH' },
      category: { type: 'enum_activities_category', defaultValue: 'OTHER' },
      status: { type: 'enum_activities_status', defaultValue: 'DRAFT' },
      point: { type: DataTypes.INTEGER, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE }
    });

    console.log('✅ News and Activities tables created successfully.');
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('activities');
    await queryInterface.dropTable('news');
    await queryInterface.dropTable('news_categories');
  }
};
