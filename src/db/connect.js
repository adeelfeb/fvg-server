// src/db/connect.js
import { Pool } from 'pg';
import config from '../config/index.js';

let pool;

const connectDB = async () => {
    try {
        if (!config.db.user || !config.db.host || !config.db.database || !config.db.password) {
            console.error("❌ Missing PostgreSQL connection credentials in .env");
            process.exit(1);
        }

        pool = new Pool({
            user: config.db.user,
            host: config.db.host,
            database: config.db.database,
            password: config.db.password,
            port: config.db.port,
            ssl: config.db.ssl
        });

        // Test connection
        const client = await pool.connect();
        console.log("✅ Connected to PostgreSQL database!");
        client.release(); // Release the client back to the pool

    } catch (error) {
        console.error("❌ PostgreSQL connection error:", error.message);
        // Do not exit process immediately, allow graceful shutdown or retry logic
        throw error; // Re-throw to be caught in main.js
    }
};

// Function to get the PostgreSQL pool instance
const getDbPool = () => {
    if (!pool) {
        throw new Error("PostgreSQL pool not initialized. Call connectDB first.");
    }
    return pool;
};

export { connectDB, getDbPool };