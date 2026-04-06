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
        allowNull: false,
        field: 'union_fee_type_id'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
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
    evidenceImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'evidence_image_url'
    }
}, {
    tableName: 'payment_transactions',
    timestamps: true,
    underscored: true
});

module.exports = PaymentTransaction;
