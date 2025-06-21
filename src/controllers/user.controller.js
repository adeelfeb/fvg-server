// src/controllers/user.controller.js
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from '../models/user.model.js'; // Assuming you have a User model

const getUserProfile = asyncHandler(async (req, res) => {
    // This route would be protected by verifyJWT middleware
    // req.user is available from Passport session
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { id: user.id, username: user.username, email: user.email }, "User profile fetched successfully")
    );
});

export {
    getUserProfile
};