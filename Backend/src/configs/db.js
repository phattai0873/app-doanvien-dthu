const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
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

// Cấu hình Umzug để quản lý Migrations
const umzug = new Umzug({
    migrations: {
        glob: path.join(__dirname, '../db/migrations/*.js'),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected successfully.');

        // Load models and associations
        require('../models');

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
};

const runMigrations = async () => {
    try {
        console.log('🚀 Running database migrations...');
        await umzug.up();
        console.log('✅ Database migrations applied successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

module.exports = { sequelize, connectDB, runMigrations };
