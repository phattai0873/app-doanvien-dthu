const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const ActivityParticipant = sequelize.define('ActivityParticipant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    activityId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    memberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    registrationStatus: {
        type: DataTypes.ENUM('REGISTERED', 'APPROVED', 'REJECTED', 'CANCELLED'),
        defaultValue: 'REGISTERED'
    },
    attendanceStatus: {
        type: DataTypes.ENUM('PRESENT', 'ABSENT_REASON', 'ABSENT_NO_REASON', 'LATE'),
        allowNull: true
    },
    scoreAwarded: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    remarks: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'activity_participants',
    timestamps: true
});

module.exports = ActivityParticipant;
