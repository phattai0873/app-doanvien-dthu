const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionFeePayment = sequelize.define('UnionFeePayment', {
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
    unionFeeTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'union_fee_type_id'
    },
    paymentTransactionId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'payment_transaction_id'
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    paidAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'paid_at'
    },
    note: {
        type: DataTypes.TEXT
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'union_cell_id'
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'union_branch_id'
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'union_fee_payments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['union_member_id', 'period', 'union_fee_type_id'],
            name: 'unique_member_period_type'
        }
    ]
});

module.exports = UnionFeePayment;
