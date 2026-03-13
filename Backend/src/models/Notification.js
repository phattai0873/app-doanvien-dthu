const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Hệ thống', 'Hoạt động', 'Nhắc nhở'),
        defaultValue: 'Hệ thống'
    },
    targetType: {
        type: DataTypes.ENUM('All', 'Branch', 'Cell', 'Individual'),
        defaultValue: 'All'
    },
    priority: {
        type: DataTypes.ENUM('Thấp', 'Trung bình', 'Cao'),
        defaultValue: 'Trung bình'
    },
    status: {
        type: DataTypes.ENUM('Mới', 'Đã gửi', 'Đã hủy'),
        defaultValue: 'Mới'
    },
    targetId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    senderBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;
