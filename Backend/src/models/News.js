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
    scope: {
        type: DataTypes.ENUM('Trường', 'Tỉnh'),
        defaultValue: 'Trường',
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
    },
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sharesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    viewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'news',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['categoryId'] },
        { fields: ['unionBranchId'] },
        { fields: ['unionCellId'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = News;
