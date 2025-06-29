import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../db/index.js';
import { UserRole } from '@prisma/client';


const getAllContractors = asyncHandler(async (req, res) => {
    // Find all users who have the role of CONTRACTOR
    const contractors = await prisma.user.findMany({
        where: {
            role: UserRole.CONTRACTOR
        },
        // Select which fields to return publicly
        select: {
            id: true,
            firstName: true,
            lastName: true,
            // Include profile details in the response
            profile: {
                select: {
                    roleType: true,
                    verticalSpecialization: true,
                    skills: true,
                    profilePhotoUrl: true,
                    bio: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponse(200, contractors, "Contractors fetched successfully")
    );
});

const getContractorProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contractor = await prisma.user.findUnique({
        where: {
            id,
            role: UserRole.CONTRACTOR
        },
        include: {
            profile: true // Include the full profile
        }
    });

    if (!contractor) {
        throw new ApiError(404, "Contractor not found");
    }

    return res.status(200).json(new ApiResponse(200, contractor));
});

// Example of a secured controller
const updateMyProfile = asyncHandler(async (req, res) => {
    // const userId = req.user.id; // Get user ID from verifyJWT middleware
    // const profileData = req.body;
    // const updatedProfile = await prisma.profile.update({ where: { userId }, data: profileData });
    // return res.status(200).json(new ApiResponse(200, updatedProfile, "Profile updated"));
});


export {
    getAllContractors,
    getContractorProfile,
    updateMyProfile
};