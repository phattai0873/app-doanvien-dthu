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
        type: DataTypes.ENUM('Nháp', 'Đã đăng'),
        defaultValue: 'Nháp'
    },
    scope: {
        type: DataTypes.ENUM('Tỉnh', 'Trường'),
        defaultValue: 'Trường',
        allowNull: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'news',
    timestamps: true
});

module.exports = News;
