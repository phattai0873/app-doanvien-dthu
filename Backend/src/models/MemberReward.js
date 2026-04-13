const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

/**
 * Khen thưởng
 */
const MemberReward = sequelize.define('MemberReward', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT
    },
    issuedDate: {
        type: DataTypes.DATEONLY
    },
    issuedBy: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'member_rewards',
    timestamps: true,
    indexes: [
        { fields: ['unionMemberId'] }
    ]
});

module.exports = MemberReward;
