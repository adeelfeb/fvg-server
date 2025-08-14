import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../db/index.js"; // Assuming your Prisma client is exported as default from this path

/**
 * @description Middleware to verify JWT token from the Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        // The header format is "Bearer <token>"
        // console.log("Verifying JWT token...");
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: Access token missing");
        }

        // 2. Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // The decodedToken should contain the user's _id (as set during token generation)
        const userId = decodedToken?._id;

        if (!userId) {
            throw new ApiError(401, "Invalid Access Token: User ID not found in token");
        }

        // 3. Find the user in the database using the ID from the token
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                // Do NOT select password here for security reasons
            },
        });

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        // 4. Attach the user object to the request for subsequent middleware/controllers
        req.user = user; // Now, in your routes, you can access req.user

        // 5. Proceed to the next middleware or route handler
        next();

    } catch (error) {
        // console.error("Error in verifyJWT middleware:", error);

        if (error instanceof ApiError) {
            throw error; // Re-throw custom API errors
        } else if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, "Access token expired");
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, "Invalid access token");
        } else {
            throw new ApiError(500, "Authentication failed: An unexpected error occurred.", error.message);
        }
    }
});

export { verifyJWT };
