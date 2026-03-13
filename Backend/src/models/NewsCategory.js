const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NewsCategory = sequelize.define('NewsCategory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'news_categories',
    timestamps: true
});

module.exports = NewsCategory;

