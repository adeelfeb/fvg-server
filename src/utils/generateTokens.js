// src/utils/generateTokens.js
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getDbPool } from '../db/connect.js';

// Function to generate JWTs (Access and Refresh Tokens)
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const pool = getDbPool();
        const client = await pool.connect();

        // Find user by ID to get any required data for token
        const userResult = await client.query('SELECT id, email FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        client.release();

        if (!user) {
            throw new Error("User not found for token generation");
        }

        // Generate Access Token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            config.accessTokenSecret,
            { expiresIn: config.accessTokenExpiry }
        );

        // Generate Refresh Token
        const refreshToken = jwt.sign(
            { id: user.id }, // Refresh token usually has less info
            config.refreshTokenSecret,
            { expiresIn: config.refreshTokenExpiry }
        );

        // In a real app, you'd save the refresh token to the database for revocation
        // For this example, we're simply returning it.
        // await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error generating tokens:", error.message);
        throw new Error("Could not generate tokens");
    }
};

export { generateAccessAndRefreshTokens };