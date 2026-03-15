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
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    unionLevel: {
        type: DataTypes.STRING
    },
    officeAddress: {
        type: DataTypes.STRING
    },
    phoneNumber: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    termStartYear: {
        type: DataTypes.INTEGER
    },
    termEndYear: {
        type: DataTypes.INTEGER
    },
    logoUrl: {
        type: DataTypes.STRING
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'union_branches',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['code']
        }
    ]
});

module.exports = UnionBranch;
