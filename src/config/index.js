// src/config/index.js
import dotenv from 'dotenv';

// Load environment variables based on the current environment
dotenv.config({
    path: './.env' // Always load from the root .env file
});

const config = {
    port: process.env.PORT,
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10), // Ensure port is a number
        ssl: {
            rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false // Render handles SSL in production, local might need false
        }
    },
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [], // Handle multiple origins
    sessionSecret: process.env.SESSION_SECRET,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;