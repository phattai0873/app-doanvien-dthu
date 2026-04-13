const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
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
        allowNull: true,
        field: 'union_fee_type_id'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        field: 'total_amount'
    },
    period: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentProvider: {
        type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'MOMO', 'VNPAY', 'ZALOPAY'),
        defaultValue: 'CASH'
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'),
        defaultValue: 'PENDING'
    },
    internalTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'internal_transaction_id'
    },
    transactionCode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'transaction_code'
    },
    gatewayTransactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'gateway_transaction_id'
    },
    rawResponse: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'raw_response'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at'
    },
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'approved_by'
    },
    evidenceImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'evidence_image_url'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'payment_transactions',
    timestamps: true,
    underscored: true
});

module.exports = PaymentTransaction;
