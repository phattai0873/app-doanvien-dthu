const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NewsLike = sequelize.define('NewsLike', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    newsId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'news_likes',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            unique: true,
            fields: ['newsId', 'userId']
        }
    ]
});

module.exports = NewsLike;
