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
        type: DataTypes.ENUM('PRESENT', 'ABSENT_REASON', 'ABSENT_NO_REASON', 'LATE', 'Vắng', 'Có mặt', 'Có phép'),
        defaultValue: 'ABSENT_NO_REASON'
    },
    remarks: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'attendance',
    timestamps: true,
    indexes: [
        { fields: ['status'] }
    ]
});

module.exports = Attendance;
