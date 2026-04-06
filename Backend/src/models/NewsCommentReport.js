const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NewsCommentReport = sequelize.define('NewsCommentReport', {
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
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'RESOLVED', 'REJECTED'),
        defaultValue: 'PENDING'
    }
}, {
    tableName: 'news_comment_reports',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'commentId']
        },
        { fields: ['commentId'] },
        { fields: ['status'] }
    ]
});

module.exports = NewsCommentReport;
