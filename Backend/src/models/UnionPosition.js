const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionPosition = sequelize.define('UnionPosition', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    scopeLevel: {
        type: DataTypes.ENUM('CELL', 'BRANCH', 'SYSTEM'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'union_positions',
    timestamps: true
});

module.exports = UnionPosition;
