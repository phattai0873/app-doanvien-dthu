const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionMemberHistory = sequelize.define('UnionMemberHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('transfer', 'role_change', 'status_change', 'achievement', 'discipline'),
        allowNull: false
    },
    oldValue: {
        type: DataTypes.TEXT
    },
    newValue: {
        type: DataTypes.TEXT
    },
    actionDate: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    note: {
        type: DataTypes.TEXT
    },
    performedBy: {
        type: DataTypes.UUID // userId of the admin
    }
}, {
    tableName: 'union_member_histories',
    timestamps: true
});

module.exports = UnionMemberHistory;
