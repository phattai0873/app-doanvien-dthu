const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    tableName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recordId: {
        type: DataTypes.STRING
    },
    action: {
        type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE', 'VIEW', 'ACTIVATE_ACCOUNT'),
        allowNull: false
    },
    oldValues: {
        type: DataTypes.JSONB
    },
    newValues: {
        type: DataTypes.JSONB
    },
    ipAddress: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'audit_logs',
    timestamps: true
});

module.exports = AuditLog;
