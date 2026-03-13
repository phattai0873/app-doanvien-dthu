const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionFeePayment = sequelize.define('UnionFeePayment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    paymentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    note: {
        type: DataTypes.TEXT
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'union_fee_payments',
    timestamps: true
});

module.exports = UnionFeePayment;
