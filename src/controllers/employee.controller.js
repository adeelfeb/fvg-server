import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js'; // Assuming this path
import { ApiResponse } from '../utils/ApiResponse.js';   // Assuming this path
import { ApiError } from '../utils/ApiError.js';       // Assuming this path
import prisma from '../db/index.js';                  // Assuming this path
/**
 * @description Fetches a specific employee profile by their ID sent in the request body.
 * @route POST /api/v1/contractors/details
 * @access Public (or adjust with middleware for protected access, e.g., only authenticated clients can view details)
 * @body {string} employeeId - The ID of the employee to fetch.
 */



const getContractorsByCategory = asyncHandler(async (req, res) => {
    try {
        const { roleType, verticalSpecialization } = req.body;

        if ((!roleType || roleType.length === 0) && (!verticalSpecialization || verticalSpecialization.length === 0)) {
            throw new ApiError(400, "Please provide at least one filter: roleType or verticalSpecialization.");
        }

        // console.log("Fetching contractors with raw filters:", { roleType, verticalSpecialization });

        // Helper function to convert a slug (e.g., 'dental-admin') to Title Case (e.g., 'Dental Admin').
        // This should match how the values are stored in your database.
        const formatSlugToTitleCase = (slug) => {
            if (!slug) return '';
            return slug.split('-')
                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                       .join(' ');
        };

        // Convert incoming slugs to the format expected in the database
        const formattedRoleTypes = roleType && roleType.length > 0
            ? roleType.map(slug => formatSlugToTitleCase(slug))
            : [];
        
        const formattedVerticalSpecializations = verticalSpecialization && verticalSpecialization.length > 0
            ? verticalSpecialization.map(slug => formatSlugToTitleCase(slug))
            : [];

        console.log("Fetching contractors with formatted filters:", { formattedRoleTypes, formattedVerticalSpecializations });


        // This array will hold the conditions for our OR search.
        const filterConditions = [];

        if (formattedRoleTypes.length > 0) {
            filterConditions.push({
                roleType: { hasSome: formattedRoleTypes }
            });
        }

        if (formattedVerticalSpecializations.length > 0) {
            filterConditions.push({
                verticalSpecialization: { hasSome: formattedVerticalSpecializations }
            });
        }

        const contractors = await prisma.user.findMany({
            where: {
                role: UserRole.CONTRACTOR,
                profile: {
                    isVerified: true,
                    // The OR condition ensures a profile is returned if it matches ANY of the conditions inside the array.
                    OR: filterConditions,
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: {
                    select: {
                        id: true,
                        roleType: true,
                        verticalSpecialization: true,
                        yearsExperience: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        englishProficiency: true,
                        rateRange: true,
                        timezone: true,
                        // Ensure other fields you need are selected here
                        profilePhotoUrl: true, // Added profilePhotoUrl as it's used on frontend
                        country: true, // Added country as it's used on frontend
                        otherCountry: true, // Added otherCountry as it's used on frontend
                        otherRoleType: true, // Added otherRoleType for frontend rendering
                        otherVertical: true, // Added otherVertical for frontend rendering
                        skills: true, // Added skills for frontend rendering
                    },
                },
            },
        });

        if (!contractors || contractors.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No contractors found for the specified criteria.")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                contractors,
                "Contractor profiles fetched successfully."
            )
        );
    } catch (error) {
        console.error("Error fetching contractors by criteria:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            "An error occurred while fetching contractors.",
            error.message
        );
    }
});



const getEmployeeById = asyncHandler(async (req, res) => {
    try {
        const { employeeId } = req.body; // Extract employeeId from the request body

        // console.log("Request body (employeeId):", employeeId); // Debugging line to check the request body

        if (!employeeId) {
            throw new ApiError(400, "Employee ID is required in the request body.");
        }

        const employee = await prisma.user.findUnique({
            where: {
                id: employeeId,
                // Uncomment the line below if you only want to fetch profiles for users with the 'CONTRACTOR' role.
                // role: UserRole.CONTRACTOR,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                // Only include email/phoneNumber if genuinely needed for public profile view,
                // otherwise it's a privacy concern.
                email: true,
                phoneNumber: true,
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true, // Profile ID
                        isVerified: true,

                        // --- MODIFIED FIELDS (Matching your schema) ---
                        roleType: true,
                        verticalSpecialization: true,
                        rateRange: true,
                        englishProficiency: true,
                        availability: true,

                        otherRoleType: true,
                        otherVertical: true, // Correct: matches schema
                        yearsExperience: true,
                        skills: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        otherLanguage: true,
                        customRate: true,
                        resumeUrl: true,
                        profilePhotoUrl: true,
                        internetSpeedScreenshotUrl: true,
                        timezone: true,
                        country: true,
                        otherCountry: true,
                        videoIntroductionUrl: true, // Correct: matches schema
                        portfolioUrl: true,

                        // --- Compliance fields (Matching your schema) ---
                        hipaaCertified: true,
                        professionalCertValid: true, // Correct: matches schema
                        signedNda: true,
                        backgroundCheck: true, // Correct: matches schema
                        criminalRecordCheck: true,
                        gdprTraining: true, // Correct: matches schema
                        pciCompliance: true, // Correct: matches schema
                        socialMediaScreening: true, // Correct: matches schema
                        usInsuranceCompliance: true, // Correct: matches schema
                        canadaInsuranceCompliance: true, // Correct: matches schema
                        willingToSignNda: true,
                        willingBackgroundCheck: true, // Correct: matches schema
                        willingReferenceCheck: true, // Correct: matches schema
                        privacyPolicyConsent: true, // Correct: matches schema
                        creditCheck: true,
                        vulnerableSectorCheck: true,
                        contactConsent: true, // Correct: matches schema
                        emailConsent: true, // Correct: matches schema

                        createdAt: true,
                        updatedAt: true,
                        // Do NOT include `user` or `userId` here unless you specifically need to nest
                        // the user object *within* the profile selection, which is usually redundant
                        // as the parent `employee` object already contains the user details.
                    },
                },
            },
        });

        if (!employee) {
            // If no employee is found with the given ID (or filters if applied)
            throw new ApiError(404, "Employee not found or profile is not available.");
        }

        // Send a successful response with the fetched employee data
        return res.status(200).json(
            new ApiResponse(
                200,
                employee,
                "Employee profile fetched successfully."
            )
        );

    } catch (error) {
        // Log the detailed error for debugging purposes on the server
        console.error("Error fetching employee by ID:", error);

        // Determine if it's a known API error or an unexpected one
        const apiError = error instanceof ApiError
            ? error
            : new ApiError(
                500,
                "An unexpected error occurred while fetching the employee profile.",
                error.message // Pass the original error message for more detail
            );

        // Re-throw the ApiError so the asyncHandler can catch it and send a standardized error response
        throw apiError;
    }
});






const getVerifiedContractors = asyncHandler(async (req, res) => {
    try {
        // console.log("Fetching verified contractors...");
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
                        id: true,  
                        roleType: true,
                        verticalSpecialization: true,
                        yearsExperience: true,
                        skills: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        englishProficiency: true,
                        rateRange: true,  
                        timezone: true,
                        country: true,
                        profilePhotoUrl: true,  
                        videoIntroductionUrl: true,
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
    getVerifiedContractorsLogin,
    getEmployeeById, 
    getContractorsByCategory
 };