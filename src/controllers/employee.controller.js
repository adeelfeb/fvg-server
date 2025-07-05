import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js'; // Assuming this path
import { ApiResponse } from '../utils/ApiResponse.js';   // Assuming this path
import { ApiError } from '../utils/ApiError.js';       // Assuming this path
import prisma from '../db/index.js';                  // Assuming this path

/**
 * @description Fetches all verified contractor profiles with restricted details.
 * @route GET /api/v1/contractors/verified
 * @access Public (or adjust with middleware for protected access)
 */
const getVerifiedContractors = asyncHandler(async (req, res) => {
    try {
        const verifiedContractors = await prisma.user.findMany({
            where: {
                role: UserRole.CONTRACTOR,
                profile: {
                    isVerified: false, // Filter by the new isVerified field
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                // Do NOT include email, password, phoneNumber for public view
                // createdAt: true, // Optional: if you want to show when they joined
                // updatedAt: true, // Optional

                profile: {
                    select: {
                        id: true, // Profile ID
                        roleType: true,
                        verticalSpecialization: true,
                        yearsExperience: true,
                        skills: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        englishProficiency: true,
                        rateRange: true, // Show the range, not exact customRate
                        timezone: true,
                        country: true,
                        // Exclude sensitive compliance fields, resumeUrl, internetSpeedScreenshotUrl etc.
                    },
                },
            },
        });

        // If no contractors are found, return an empty array and a success message
        if (!verifiedContractors || verifiedContractors.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No verified contractors found at this time.")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                verifiedContractors,
                "Verified contractor profiles fetched successfully."
            )
        );
    } catch (error) {
        console.error("Error fetching verified contractors:", error);
        // Re-throw the error to be caught by asyncHandler's error handling middleware
        throw new ApiError(
            500,
            "An unexpected error occurred while fetching contractor profiles.",
            error.message
        );
    }
});



const getVerifiedContractorsLogin = asyncHandler(async (req, res) => {
    try {
        const verifiedContractors = await prisma.user.findMany({
            where: {
                role: UserRole.CONTRACTOR,
                profile: {
                    isVerified: false, // Filter by the new isVerified field
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                // Do NOT include email, password, phoneNumber for public view
                // createdAt: true, // Optional: if you want to show when they joined
                // updatedAt: true, // Optional

                profile: {
                    select: {
                        id: true, // Profile ID
                        roleType: true,
                        verticalSpecialization: true,
                        yearsExperience: true,
                        skills: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        englishProficiency: true,
                        rateRange: true, // Show the range, not exact customRate
                        timezone: true,
                        country: true,
                        profilePhotoUrl: true, // Essential for display
                        videoIntroductionUrl: true,
                        bio: true,
                        // portfolioUrl: true,
                        // resumeUrl: true, // Exclude sensitive compliance fields
                        // internetSpeedScreenshotUrl: true, // Exclude sensitive compliance fields
                        // Exclude sensitive compliance fields, resumeUrl, internetSpeedScreenshotUrl etc.
                    },
                },
            },
        });

        // If no contractors are found, return an empty array and a success message
        if (!verifiedContractors || verifiedContractors.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No verified contractors found at this time.")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                verifiedContractors,
                "Verified contractor profiles fetched successfully."
            )
        );
    } catch (error) {
        console.error("Error fetching verified contractors:", error);
        // Re-throw the error to be caught by asyncHandler's error handling middleware
        throw new ApiError(
            500,
            "An unexpected error occurred while fetching contractor profiles.",
            error.message
        );
    }
});

export { 
    getVerifiedContractors,
    getVerifiedContractorsLogin
 };