const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NewsCommentLike = sequelize.define('NewsCommentLike', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    commentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'news_comment_likes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'commentId']
        },
        { fields: ['commentId'] },
        { fields: ['userId'] }
    ]
});

module.exports = NewsCommentLike;
