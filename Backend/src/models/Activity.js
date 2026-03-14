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
    isMandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'activities',
    timestamps: true
});

module.exports = Activity;
