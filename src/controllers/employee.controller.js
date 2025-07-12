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
const getEmployeeById = asyncHandler(async (req, res) => {
    try {
        const { employeeId } = req.body; // Extract employeeId from the request body

        console.log("Request body:", employeeId); // Debugging line to check the request body
        if (!employeeId) {
            throw new ApiError(400, "Employee ID is required in the request body.");
        }

        // console.log(`Fetching employee with ID: ${employeeId}...`);

        const employee = await prisma.user.findUnique({
            where: {
                id: employeeId,
                // Optionally, you might want to ensure they are a CONTRACTOR and/or verified
                // role: UserRole.CONTRACTOR,
                // profile: {
                //     isVerified: true, // Only fetch verified profiles if desired
                // },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true, // Include email if this is for a detailed view where it's appropriate
                phoneNumber: true, // Include phone number if appropriate
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true, // Profile ID
                        roleType: true,
                        otherRoleType: true, // Assuming you want this if 'Other' is selected
                        verticalSpecialization: true,
                        otherVerticalSpecialization: true, // Assuming you want this
                        yearsExperience: true,
                        skills: true,
                        remoteTools: true,
                        spokenLanguages: true,
                        otherSpokenLanguages: true, // Include if applicable
                        englishProficiency: true,
                        rateRange: true,
                        customRate: true, // Include custom rate for detailed view
                        resumeUrl: true,
                        profilePhotoUrl: true,
                        internetSpeedScreenshotUrl: true,
                        introVideoUrl: true,
                        portfolioUrl: true,
                        availability: true,
                        timezone: true,
                        otherTimezone: true, // Include if applicable
                        country: true,
                        otherCountry: true, // Include if applicable
                        // Compliance checks - only include if relevant for public/client view
                        hipaaCertified: true,
                        professionalCertificationValidation: true,
                        signedNda: true,
                        backgroundCheckCompleted: true,
                        criminalRecordCheck: true,
                        gdprAwarenessTraining: true,
                        pciComplianceAwareness: true,
                        socialMediaPublicProfileScreening: true,
                        usStateInsuranceCompliance: true,
                        canadianInsuranceCompliance: true,
                        willingToSignNda: true,
                        willingToUndergoBackgroundCheck: true,
                        willingToUndergoReferenceChecks: true,
                        agreeToPrivacyPolicy: true,
                        otherComplianceChecks: true,
                        creditCheck: true,
                        vulnerableSectorCheck: true,
                        canContactForJobOpportunities: true,
                        // Make sure to add `isVerified` if you're using it to filter
                        isVerified: true,
                    },
                },
            },
        });

        if (!employee) {
            throw new ApiError(404, "Employee not found.");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                employee,
                "Employee profile fetched successfully."
            )
        );

    } catch (error) {
        console.error("Error fetching employee by ID:", error);
        // Ensure the error is an ApiError, otherwise create one
        const apiError = error instanceof ApiError
            ? error
            : new ApiError(
                500,
                "An unexpected error occurred while fetching the employee profile.",
                error.message
            );
        throw apiError; // Re-throw for asyncHandler to catch
    }
});










/**
 * @description Fetches all verified contractor profiles with restricted details.
 * @route GET /api/v1/contractors/verified
 * @access Public (or adjust with middleware for protected access)
 */
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
    getEmployeeById
 };