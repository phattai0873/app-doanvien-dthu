const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const FeeCollectionScope = sequelize.define('FeeCollectionScope', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    feeCollectionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'fee_collection_id'
    },
    scopeType: {
        type: DataTypes.ENUM('BRANCH', 'CELL', 'ALL'),
        defaultValue: 'ALL',
        field: 'scope_type'
    },
    scopeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'scope_id'
    }
}, {
    tableName: 'fee_collection_scopes',
    timestamps: true,
    underscored: true
});

module.exports = FeeCollectionScope;
