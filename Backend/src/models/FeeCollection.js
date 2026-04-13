const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const FeeCollection = sequelize.define('FeeCollection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    feeTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'fee_type_id'
    },
    periodType: {
        type: DataTypes.ENUM('MONTH', 'YEAR', 'CUSTOM'),
        defaultValue: 'YEAR',
        field: 'period_type'
    },
    amountPerUnit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: 'amount_per_unit'
    },
    periodStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'period_start'
    },
    periodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'period_end'
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    allowPartialPayment: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'allow_partial_payment'
    },
    documentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'document_url'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'fee_collections',
    timestamps: true,
    underscored: true
});

module.exports = FeeCollection;
