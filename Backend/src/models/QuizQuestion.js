const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const QuizQuestion = sequelize.define('QuizQuestion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    questionType: {
        type: DataTypes.ENUM('SINGLE', 'MULTIPLE', 'ESSAY'),
        defaultValue: 'SINGLE'
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'quiz_questions',
    timestamps: true
});

module.exports = QuizQuestion;
