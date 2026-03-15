const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const CellMeeting = sequelize.define('CellMeeting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT
    },
    meetingTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    minutes: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('Mới tạo', 'Đang họp', 'Hoàn thành', 'Hủy'),
        defaultValue: 'Mới tạo'
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    chairpersonId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    secretaryId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'cell_meetings',
    timestamps: true
});

module.exports = CellMeeting;
