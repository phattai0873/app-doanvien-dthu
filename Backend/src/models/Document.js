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
    fileType: {
        type: DataTypes.STRING
    },
    issuedDate: {
        type: DataTypes.DATE
    },
    issuingAuthority: {
        type: DataTypes.STRING
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
        defaultValue: 'SCHOOL',
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
        defaultValue: 'PUBLISHED'
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'documents',
    timestamps: true
});

module.exports = Document;
