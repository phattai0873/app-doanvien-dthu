const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NewsComment = sequelize.define('NewsComment', {
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
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID của bình luận gốc, NULL nếu là bình luận gốc'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    reportsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('VISIBLE', 'HIDDEN'),
        defaultValue: 'VISIBLE'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Đánh dấu bình luận đã bị người dùng xóa'
    }
}, {
    tableName: 'news_comments',
    timestamps: true,
    // Paranoid true đã được set mặc định ở db.js, 
    // tuy nhiên ta dùng isDeleted để phục vụ logic 'giữ context'
    indexes: [
        { fields: ['newsId'] },
        { fields: ['userId'] },
        { fields: ['parentId'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = NewsComment;
