const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const NotificationReadStatus = sequelize.define('NotificationReadStatus', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    readAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notification_read_statuses',
    timestamps: true
});

module.exports = NotificationReadStatus;
