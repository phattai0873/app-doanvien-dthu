const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

/**
 * Đánh giá & rèn luyện hàng năm
 */
const MemberEvaluation = sequelize.define('MemberEvaluation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    unionMemberId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    trainingScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    classification: {
        type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK'),
        defaultValue: 'AVERAGE'
    },
    note: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'member_evaluations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['unionMemberId', 'year'] // 1 record per user per year
        }
    ]
});

module.exports = MemberEvaluation;
