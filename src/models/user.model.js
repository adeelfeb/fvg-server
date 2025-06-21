// src/models/user.model.js
import { getDbPool } from '../db/connect.js';
import bcrypt from 'bcryptjs';

class User {
    static async create({ username, email, password }) {
        const pool = getDbPool();
        const client = await pool.connect();
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await client.query(
                `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email`,
                [username, email, hashedPassword]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async findByEmail(email) {
        const pool = getDbPool();
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async findById(id) {
        const pool = getDbPool();
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async isPasswordCorrect(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

export default User;