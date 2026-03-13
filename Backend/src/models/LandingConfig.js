const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const LandingConfig = sequelize.define('LandingConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'e.g. hero_section, contact_info'
    },
    value: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'LandingConfigs'
});

module.exports = LandingConfig;
