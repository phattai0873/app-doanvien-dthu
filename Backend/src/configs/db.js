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
        logging: false, // Set to true if you want to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected successfully.');

        // Use sync() only in development. In production, use migrations!
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synced.');

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };