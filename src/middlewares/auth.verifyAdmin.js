import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// No need to import jwt or prisma here if verifyJWT is used first
// If you want verifyAdmin to be standalone, then import them.
// For this example, we'll assume verifyJWT runs first and populates req.user.

// You'll need the UserRole enum if you don't use the prisma client directly for comparison
// Make sure this enum matches your Prisma schema
import { UserRole } from "@prisma/client"; // Adjust path if your UserRole enum isn't directly from @prisma/client

/**
 * @description Middleware to check if the authenticated user has an 'ADMIN' role.
 * This middleware assumes `verifyJWT` has already run and `req.user` is populated.
 * @param {Object} req - Express request object (expected to have req.user from verifyJWT)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyAdmin = asyncHandler(async (req, res, next) => {
    // Ensure req.user exists (meaning verifyJWT has run successfully)
    if (!req.user) {
        throw new ApiError(401, "Unauthorized: User not authenticated. (verifyJWT missing)");
    }

    // Check if the user's role is ADMIN
    if (req.user.role !== UserRole.ADMIN) {
        throw new ApiError(403, "Forbidden: Only administrators can access this resource.");
    }

    // If the user is an admin, proceed to the next middleware or route handler
    next();
});

export { verifyAdmin };