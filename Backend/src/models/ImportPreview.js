const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

/**
 * Lưu trữ tạm thời kết quả parse Excel trước khi xác nhận nhập
 */
const ImportPreview = sequelize.define('ImportPreview', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    data: {
        type: DataTypes.JSONB, // Danh sách đoàn viên đã parse
        allowNull: false
    },
    config: {
        type: DataTypes.JSONB, // Chứa { mode, unionCellId }
        allowNull: false
    },
    summary: {
        type: DataTypes.JSONB, // { total, valid, error, warning }
        allowNull: true
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'import_previews',
    timestamps: true
});

module.exports = ImportPreview;
