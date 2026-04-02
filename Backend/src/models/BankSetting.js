const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const BankSetting = sequelize.define('BankSetting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    bankId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MB',
        comment: 'e.g. MB, VCB, ICB'
    },
    bankName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'MB Bank (Quân Đội)'
    },
    accountNo: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0383123456'
    },
    accountName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'DOAN THANH NIEN DTHU'
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'bank_settings',
    timestamps: true
});

module.exports = BankSetting;
