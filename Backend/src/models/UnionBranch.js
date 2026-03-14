const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionBranch = sequelize.define('UnionBranch', {
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
    partyLevel: {
        type: DataTypes.STRING
    },
    officeAddress: {
        type: DataTypes.STRING
    },
    phoneNumber: {
        type: DataTypes.STRING
    },
}, {
    tableName: 'union_branches',
    timestamps: true
});

module.exports = UnionBranch;
