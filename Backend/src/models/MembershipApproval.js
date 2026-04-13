const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

/**
 * Nghị quyết chuẩn y kết nạp
 */
const MembershipApproval = sequelize.define('MembershipApproval', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true // 1-1 relationship as per Option 1 in feedback
    },
    decisionNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    approvedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tên hoặc Chức vụ người ký'
    },
    note: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'membership_approvals',
    timestamps: true
});

module.exports = MembershipApproval;
