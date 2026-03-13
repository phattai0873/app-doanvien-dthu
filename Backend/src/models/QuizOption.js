const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/db');

const QuizOption = sequelize.define('QuizOption', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isCorrect: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'quiz_options',
    timestamps: true
});

module.exports = QuizOption;
