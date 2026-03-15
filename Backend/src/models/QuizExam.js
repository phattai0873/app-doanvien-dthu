const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const QuizExam = sequelize.define('QuizExam', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timeLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    satisfactoryScore: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    startDate: {
        type: DataTypes.DATE
    },
    endDate: {
        type: DataTypes.DATE
    },
    unionBranchId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unionCellId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    level: {
        type: DataTypes.ENUM('SCHOOL', 'BRANCH', 'CELL'),
        defaultValue: 'SCHOOL',
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CLOSED'),
        defaultValue: 'DRAFT'
    }
}, {
    tableName: 'quiz_exams',
    timestamps: true
});

module.exports = QuizExam;
