const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: 'postgres'
});

async function createDB() {
    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${process.env.DB_NAME}...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log("Database created successfully.");
        } else {
            console.log("Database already exists.");
        }
    } catch (err) {
        console.error("Error creating DB:", err.message);
    } finally {
        await client.end();
    }
}
createDB();
