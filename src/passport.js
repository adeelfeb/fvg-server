// src/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt'; // Assuming you use bcrypt for password hashing
import prisma from './db/index.js'; // Import your Prisma client instance

// Local Strategy for username/password login
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // Use email as the username field
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            // 1. Find user by email using Prisma
            const user = await prisma.user.findUnique({
                where: { email: email }
            });

            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            // 2. Compare password with hashed password using bcrypt
            // Ensure your User model in Prisma schema has a 'password' field
            // and it's hashed when the user is registered.
            if (!user.password) {
                 // Handle cases where user might have been created via social login and has no local password
                 return done(null, false, { message: 'Account registered without a password. Please use social login.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            return done(null, user); // User found and password matches
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize user to store in the session (what data to put in the session cookie)
passport.serializeUser((user, done) => {
    // Assuming 'user.id' is the primary key in your Prisma User model
    done(null, user.id);
});

// Deserialize user from the session (retrieve user object from ID in session)
passport.deserializeUser(async (id, done) => {
    try {
        // Find user by ID using Prisma
        const user = await prisma.user.findUnique({
            where: { id: id }
        });
        done(null, user); // Attach the full user object to req.user
    } catch (err) {
        done(err);
    }
});

export default passport;