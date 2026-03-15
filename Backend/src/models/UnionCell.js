const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const UnionCell = sequelize.define('UnionCell', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memberCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    unionBranchId: {
        type: DataTypes.UUID
    },
    courseYear: {
        type: DataTypes.STRING,
        allowNull: true
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'graduated', 'dissolved'),
        defaultValue: 'active'
    },
    establishedDate: {
        type: DataTypes.DATEONLY
    },
    defaultMeetingLocationId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'union_cells',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['code']
        }
    ]
});

module.exports = UnionCell;
