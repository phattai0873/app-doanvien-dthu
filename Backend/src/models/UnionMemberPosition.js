const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionMemberPosition = sequelize.define('UnionMemberPosition', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    assignedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endedDate: {
        type: DataTypes.DATE
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'union_member_positions',
    timestamps: true
});

module.exports = UnionMemberPosition;
