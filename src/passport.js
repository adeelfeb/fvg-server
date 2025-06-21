// src/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from './models/user.model.js'; // Your User model for database interaction

// Local Strategy for username/password login
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // Use email as the username field
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await User.findByEmail(email);

            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            const isMatch = await User.isPasswordCorrect(password, user.password);

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
    done(null, user.id); // Store only the user ID in the session
});

// Deserialize user from the session (retrieve user object from ID in session)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Attach the full user object to req.user
    } catch (err) {
        done(err);
    }
});

export default passport;