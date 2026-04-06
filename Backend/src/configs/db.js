const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false,
        pool: {
            max: 30,
            min: 5,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            keepAlive: true,
            connectTimeout: 10000
        },
        timezone: '+07:00',
        define: {
            timestamps: true,
            paranoid: true,
            deletedAt: 'deletedAt'
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected successfully.');

        // Load models and associations
        const models = require('../models');

        // Sync models sequentially in development to handle complex dependencies
        // Sync PaymentTransaction before UnionFeePayment to satisfy foreign key constraint
        if (models.PaymentTransaction) {
            await models.PaymentTransaction.sync({ alter: true });
        }
        
        // Use sync({ alter: true }) only in development. 
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synced.');

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };