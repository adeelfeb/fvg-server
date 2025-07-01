// src/middlewares/auth.middleware.js
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';

// Middleware to check if user is authenticated (Passport.js)
const verifyJWT = asyncHandler(async (req, res, next) => {
    // Passport.js handles authentication via sessions.
    // If using JWTs in Authorization header, you'd verify JWT here.
    // For session-based authentication:
    if (!req.isAuthenticated()) {
        throw new ApiError(401, "Unauthorized access: Please log in");
    }
    next();
});

export { verifyJWT };