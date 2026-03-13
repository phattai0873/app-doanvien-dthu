const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const QuizAttempt = sequelize.define('QuizAttempt', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    correctAnswersCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    submitTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'quiz_attempts',
    timestamps: true
});

module.exports = QuizAttempt;
