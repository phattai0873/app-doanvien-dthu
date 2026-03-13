const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    attendanceTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('Vắng', 'Có mặt', 'Có phép'),
        defaultValue: 'Vắng'
    },
    remarks: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'attendance',
    timestamps: true
});

module.exports = Attendance;
