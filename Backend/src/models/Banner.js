const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    linkUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'banners',
    timestamps: true
});

module.exports = Banner;
