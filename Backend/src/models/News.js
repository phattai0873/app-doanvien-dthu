const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const News = sequelize.define('News', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    summary: {
        type: DataTypes.TEXT
    },
    content: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    thumbnailUrl: {
        type: DataTypes.STRING
    },
    bannerUrl: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
        defaultValue: 'DRAFT'
    },
    level: {
        type: DataTypes.ENUM('SCHOOL', 'BRANCH', 'CELL'),
        defaultValue: 'SCHOOL',
        allowNull: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    authorId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'news',
    timestamps: true
});

module.exports = News;
