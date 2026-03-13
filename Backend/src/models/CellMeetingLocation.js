const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const CellMeetingLocation = sequelize.define('CellMeetingLocation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT
    },
    capacity: {
        type: DataTypes.INTEGER
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'cell_meeting_locations',
    timestamps: true
});

module.exports = CellMeetingLocation;
