const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Meeting = sequelize.define('Meeting', {
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
        type: DataTypes.TEXT
    },
    meetingTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    minutes: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'DRAFT'
    },
    type: {
        type: DataTypes.ENUM('ROUTINE', 'THEMATIC', 'CONGRESS'),
        defaultValue: 'ROUTINE'
    },
    level: {
        type: DataTypes.ENUM('SCHOOL', 'BRANCH', 'CELL'),
        defaultValue: 'CELL'
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rating: {
        type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
        allowNull: true
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    chairpersonId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    secretaryId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    organizerBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    organizerCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    checkinCode: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    checkinCodeExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'meetings',
    timestamps: true
});

module.exports = Meeting;
