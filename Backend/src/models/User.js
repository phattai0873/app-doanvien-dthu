const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
    },
    tokenDevice: {
        type: DataTypes.STRING
    },
    lastLogin: {
        type: DataTypes.DATE
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    refreshTokenHash: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // New scoping fields for Admins
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { fields: ['username'] },
        { fields: ['email'] },
        { fields: ['isActive'] },
        { fields: ['isLocked'] },
        { fields: ['unionBranchId'] },
        { fields: ['unionCellId'] }
    ]
});

module.exports = User;
