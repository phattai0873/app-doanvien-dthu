const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionFeeType = sequelize.define('UnionFeeType', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'union_fee_types',
    timestamps: true,
    underscored: true
});

module.exports = UnionFeeType;
