const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    issuedDate: {
        type: DataTypes.DATE
    },
    issuingAuthority: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('PRIVATE', 'PUBLISH'),
        defaultValue: 'PUBLISH'
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    level: {
        type: DataTypes.ENUM('SCHOOL', 'BRANCH', 'CELL'),
        defaultValue: 'SCHOOL'
    }
}, {
    tableName: 'documents',
    timestamps: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['level'] },
        { fields: ['categoryId'] },
        { fields: ['unionBranchId'] },
        { fields: ['unionCellId'] }
    ]
});

module.exports = Document;
