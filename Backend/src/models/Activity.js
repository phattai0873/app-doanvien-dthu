const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.ENUM('Sinh hoạt', 'Hoạt động'),
        defaultValue: 'Hoạt động'
    },
    level: {
        type: DataTypes.ENUM('SCHOOL', 'BRANCH', 'CELL'),
        defaultValue: 'BRANCH'
    },
    category: {
        type: DataTypes.ENUM('VOLUNTARY', 'ACADEMIC', 'SPORTS', 'CULTURE', 'POLITICAL', 'OTHER'),
        defaultValue: 'OTHER'
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'DRAFT'
    },
    approvalRole: {
        type: DataTypes.STRING, // Role code that can approve this
    },
    isMandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    point: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    organizedByBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    organizedByCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionBranchId: { // Keep for scoping/visibility
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
    tableName: 'activities',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['startDate'] },
        { fields: ['unionBranchId'] },
        { fields: ['category'] },
        { fields: ['type'] }
    ]
});

module.exports = Activity;
