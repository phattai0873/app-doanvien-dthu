const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

/**
 * Kỷ luật
 */
const MemberDiscipline = sequelize.define('MemberDiscipline', {
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
    tableName: 'member_disciplines',
    timestamps: true,
    indexes: [
        { fields: ['unionMemberId'] }
    ]
});

module.exports = MemberDiscipline;
