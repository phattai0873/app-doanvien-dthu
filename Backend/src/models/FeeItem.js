const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const FeeItem = sequelize.define('FeeItem', {
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
    label: {
        type: DataTypes.STRING,
        allowNull: false
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'fee_items',
    timestamps: true,
    underscored: true
});

module.exports = FeeItem;
