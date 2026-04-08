const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const ProfileUpdateRequest = sequelize.define('ProfileUpdateRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    oldData: {
        type: DataTypes.JSON, // Dữ liệu cũ để so sánh
        allowNull: false
    },
    newData: {
        type: DataTypes.JSON, // Dữ liệu mới đang chờ duyệt
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    note: {
        type: DataTypes.TEXT, // Lý do từ chối hoặc ghi chú duyệt
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.UUID, // ID người duyệt
        allowNull: true
    }
}, {
    tableName: 'profile_update_requests',
    timestamps: true
});

module.exports = ProfileUpdateRequest;
