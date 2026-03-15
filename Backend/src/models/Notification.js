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
    category: {
        type: DataTypes.ENUM('SYSTEM', 'ACTIVITY', 'MEETING', 'FEE', 'DOCUMENT'),
        defaultValue: 'SYSTEM'
    },
    targetType: {
        type: DataTypes.ENUM('ALL', 'BRANCH', 'CELL', 'ROLE', 'INDIVIDUAL'),
        defaultValue: 'ALL'
    },
    targetId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    targetRole: {
        type: DataTypes.ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'CELL_ADMIN', 'MEMBER'),
        allowNull: true
    },
    createdByRole: {
        type: DataTypes.ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'CELL_ADMIN', 'SYSTEM'),
        defaultValue: 'SYSTEM'
    },
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        defaultValue: 'MEDIUM'
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'SENT', 'CANCELLED'),
        defaultValue: 'DRAFT'
    },
    senderBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    entityId: {
        type: DataTypes.STRING, // Can be UUID or other ID types
        allowNull: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;
