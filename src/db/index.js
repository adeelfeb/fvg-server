let pool;

// src/db/prisma.js (or src/db/index.js)
import { PrismaClient, UserRole } from '@prisma/client';

// Initialize Prisma Client
// It's good practice to make the client accessible globally or in a single place.
const prisma = new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // Optional: Log database queries for debugging
});

// Function to connect to the database (Prisma's internal connection)
// This will just verify the connection when called, Prisma manages the pool internally.
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("✅ Connected to PostgreSQL database using Prisma!");
    } catch (error) {
        console.error("❌ Prisma database connection failed!", error.message);
        throw error; // Re-throw to be caught in main.js
    }
};

// Export the prisma client instance as default
// This allows you to import it easily as `import prisma from '../db/prisma.js';`
export default prisma;

// Function to get the PostgreSQL pool instance
const getDbPool = () => {
    if (!pool) {
        throw new Error("PostgreSQL pool not initialized. Call connectDB first.");
    }
    return pool;
};

export { connectDB, UserRole };