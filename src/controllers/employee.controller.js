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

        // console.log("Fetching contractors with filters:", { roleType, verticalSpecialization });

        const formattedRoleTypes = roleType || [];
        const formattedVerticalSpecializations = verticalSpecialization || [];


        // console.log("Fetching contractors with formatted filters:", { formattedRoleTypes, formattedVerticalSpecializations });

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
                    // isVerified: false,
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
                        profilePhotoUrl: true,
                        country: true,
                        otherCountry: true,
                        otherRoleType: true,
                        otherVertical: true,
                        skills: true,
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
        const { employeeId } = req.body;
        // Ensure req.user is available from your authentication middleware
        // req.user should contain the ID of the currently logged-in client
        const clientId = req.user?.id; // Assuming req.user is the client who made the request

        if (!employeeId) {
            throw new ApiError(400, "Employee ID is required in the request body.");
        }

        if (!clientId) {
            // This case should ideally be handled by an auth middleware,
            // but as a fallback, ensure a client is logged in to check hiring status.
            // If this endpoint is ever meant to be accessible to unauthenticated users
            // (e.g., for a public view), you might adjust this.
            throw new ApiError(401, "Client authentication is required to check hiring status.");
        }

        // 1. Check if the client has already hired this specific employee
        // --- FIX STARTS HERE ---
        const existingHireRecord = await prisma.clientContractor.findFirst({ // Changed from hiredEmployee to clientContractor
            where: {
                clientId: clientId,
                // Make sure employeeId corresponds to contractorId in your schema
                contractorId: employeeId, // Assuming employeeId passed from frontend is the contractorId
            },
        });
        // --- FIX ENDS HERE ---

        const isAlreadyHired = !!existingHireRecord; // true if a record exists, false otherwise

        let hasSavedEmployee = false;

        if (!isAlreadyHired) {
        const likedRecord = await prisma.likedContractor.findUnique({
            where: {
            clientId_contractorId: {
                clientId,
                contractorId: employeeId,
            },
            },
        });

        hasSavedEmployee = !!likedRecord;
        }


        const vpcPriceRecord = await prisma.vpcPricing.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        let vpcPrice = null;
        if (vpcPriceRecord) {
            vpcPrice = vpcPriceRecord.unitPrice / 100;
        }

        // 2. Conditionally select fields based on hiring status
        const employeeSelect = {
            id: true,
            firstName: true,
            lastName: true,
            // Only include email/phoneNumber if the client has hired the employee
            email: isAlreadyHired, // true/false will include/exclude the field
            phoneNumber: isAlreadyHired, // true/false will include/exclude the field
            createdAt: true,
            updatedAt: true,
            profile: {
                select: {
                    id: true,
                    isVerified: true,
                    roleType: true,
                    verticalSpecialization: true,
                    rateRange: true,
                    englishProficiency: true,
                    availability: true,
                    finalCost: true,
                    otherRoleType: true,
                    otherVertical: true,
                    yearsExperience: true,
                    skills: true,
                    remoteTools: true,
                    spokenLanguages: true,
                    otherLanguage: true,
                    customRate: true,
                    profilePhotoUrl: true,
                    internetSpeedScreenshotUrl: true,
                    timezone: true,
                    country: true,
                    otherCountry: true,
                    videoIntroductionUrl: true,

                    // Conditionally include resumeUrl and portfolioUrl
                    resumeUrl: isAlreadyHired,
                    portfolioUrl: isAlreadyHired,

                    hipaaCertified: isAlreadyHired,
                    professionalCertValid: isAlreadyHired,
                    signedNda: isAlreadyHired,
                    backgroundCheck: isAlreadyHired,
                    criminalRecordCheck: isAlreadyHired,
                    gdprTraining: isAlreadyHired,
                    pciCompliance: isAlreadyHired,
                    socialMediaScreening: isAlreadyHired,
                    usInsuranceCompliance: isAlreadyHired,
                    canadaInsuranceCompliance: isAlreadyHired,
                    willingToSignNda: isAlreadyHired,
                    willingBackgroundCheck: isAlreadyHired,
                    willingReferenceCheck: isAlreadyHired,
                    privacyPolicyConsent: isAlreadyHired,
                    creditCheck: isAlreadyHired,
                    vulnerableSectorCheck: isAlreadyHired,
                    contactConsent: isAlreadyHired,
                    emailConsent: isAlreadyHired,
                    createdAt: isAlreadyHired,
                    updatedAt: isAlreadyHired,
                },
            },
        };

        const employee = await prisma.user.findUnique({
            where: {
                id: employeeId,
                // Uncomment the line below if you only want to fetch profiles for users with the 'CONTRACTOR' role.
                // role: UserRole.CONTRACTOR,
            },
            select: employeeSelect, // Use the dynamically built select object
        });

        if (!employee) {
            throw new ApiError(404, "Employee not found or profile is not available.");
        }
        
        const responseData = {
        ...employee,
        vpcUnitPrice: vpcPrice,
        isAlreadyHired,
        hasSavedEmployee, // ✅ new flag
        };


        return res.status(200).json(
            new ApiResponse(
                200,
                responseData,
                "Employee profile fetched successfully."
            )
        );

    } catch (error) {
        console.error("Error fetching employee by ID:", error);

        const apiError = error instanceof ApiError
            ? error
            : new ApiError(
                  500,
                  "An unexpected error occurred while fetching the employee profile.",
                  error.message
              );

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