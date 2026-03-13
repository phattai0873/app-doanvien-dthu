const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const DocumentCategory = sequelize.define('DocumentCategory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'document_categories',
    timestamps: true
});

module.exports = DocumentCategory;
