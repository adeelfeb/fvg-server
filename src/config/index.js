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
        database: process.env.DB_DATABASE,  
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432', 10),  
        ssl: {
            rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false  
        }
    },
    loxoApiKey: process.env.LOXO_API_KEY,
    loxoSlug: process.env.LOXO_SLUG, 
    loxoDomain: process.env.LOXO_DOMAIN || 'app.loxo.co', 
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],  
    sessionSecret: process.env.SESSION_SECRET,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;