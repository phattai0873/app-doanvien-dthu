const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Permission = sequelize.define('Permission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    module: {
        type: DataTypes.STRING
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['code'] }
    ]
});

module.exports = Permission;
