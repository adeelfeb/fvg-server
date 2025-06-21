// src/controllers/auth.controller.js
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from '../models/user.model.js';
import passport from 'passport';

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields (username, email, password) are required");
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({ username, email, password });

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, { id: user.id, username: user.username, email: user.email }, "User registered successfully")
    );
});

// Login user
const loginUser = asyncHandler(async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error("Passport authentication error:", err);
            return next(new ApiError(500, "Internal Server Error during login"));
        }
        if (!user) {
            // Passport's `info` object contains the message for failed authentication
            return res.status(401).json(new ApiResponse(401, null, info.message || "Invalid credentials"));
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("req.logIn error:", err);
                return next(new ApiError(500, "Error logging in user"));
            }

            // Successfully logged in, Passport session is established.
            // The cookie will be set by express-session.
            return res.status(200).json(
                new ApiResponse(200, { id: user.id, username: user.username, email: user.email }, "User logged in successfully")
            );
        });
    })(req, res, next);
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.error("Error logging out:", err);
            throw new ApiError(500, "Error logging out user");
        }
        // Clear the session cookie from the client
        res.clearCookie('connect.sid', { // 'connect.sid' is the default name for express-session cookie
            secure: true,
            httpOnly: false, // Must match the httpOnly setting when creating the cookie
            sameSite: 'None', // Must match the sameSite setting when creating the cookie
            domain: req.hostname === 'localhost' ? undefined : req.hostname // Adjust domain for production
        });
        return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
    });
});

// Get current user details
const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.isAuthenticated()) {
        throw new ApiError(401, "Not logged in");
    }
    // req.user is populated by Passport
    const user = req.user;
    return res.status(200).json(
        new ApiResponse(200, { id: user.id, username: user.username, email: user.email }, "Current user fetched successfully")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
};