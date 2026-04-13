const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const FeePayment = sequelize.define('FeePayment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'union_member_id'
    },
    feeItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'fee_item_id'
    },
    paymentTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'payment_transaction_id'
    },
    status: {
        type: DataTypes.ENUM('UNPAID', 'PENDING', 'PAID', 'REJECTED', 'OVERDUE'),
        defaultValue: 'UNPAID'
    },
    amountSnapshot: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        field: 'amount_snapshot'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at'
    },
    isLegacy: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_legacy'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'fee_payments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['union_member_id', 'fee_item_id'],
            name: 'unique_member_fee_item'
        }
    ]
});

module.exports = FeePayment;
