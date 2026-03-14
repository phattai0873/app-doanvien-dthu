const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionCell = sequelize.define('UnionCell', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    unionBranchId: {
        type: DataTypes.UUID
    },
}, {
    tableName: 'union_cells',
    timestamps: true
});

module.exports = UnionCell;
