import {
    UserRole
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js';
import jwt from 'jsonwebtoken';



// Define the helper function once, outside of the main handler functions
// This function converts a slug (e.g., 'dental-admin' or 'it_support')
// to Title Case (e.g., 'Dental Admin' or 'IT Support'), handling both hyphens and underscores.
const formatStringForDatabase = (str) => {
    if (!str) return '';
    // Replace hyphens and underscores with spaces, then title case each word
    return str.replace(/[-_]/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
};

const registerEmployee = asyncHandler(async (req, res) => {
    try {
        // --- 1. DESTRUCTURE AND VALIDATE INPUT ---
        const {
            firstName,
            lastName,
            emailAddress,
            password,
            roleType, // This will be the raw input from frontend
            roleTypeOther,
            verticalSpecialization, // This will be the raw input from frontend
            verticalSpecializationOther,
            yearsExperience,
            skills,
            remoteSoftwareTools,
            spokenLanguages,
            spokenLanguagesOther,
            englishProficiency,
            hourlyRate,
            resumeUrl,
            profilePhotoUrl,
            internetSpeedScreenshotUrl,
            videoIntroductionUrl,
            portfolioUrl,
            availability,
            timezone,
            timezoneOther,
            country,
            countryOther,
            complianceChecks,
            otherComplianceChecks,
            contactConsent,
        } = req.body;

        // console.log("Registering employee with data:"); // Debugging log to see incoming data

        // --- Basic Field Validation ---
        const missingFields = [];
        if (!firstName) missingFields.push("firstName");
        if (!lastName) missingFields.push("lastName");
        if (!emailAddress) missingFields.push("emailAddress");
        if (!password) missingFields.push("password");
        if (!roleType || !Array.isArray(roleType) || roleType.length === 0) missingFields.push("roleType");
        if (!yearsExperience) missingFields.push("yearsExperience");
        if (!englishProficiency) missingFields.push("englishProficiency");
        if (!hourlyRate) missingFields.push("hourlyRate");
        if (!availability) missingFields.push("availability");
        if (!timezone) missingFields.push("timezone");
        if (!country) missingFields.push("country");
        if (!resumeUrl) missingFields.push("resumeUrl");
        if (!profilePhotoUrl) missingFields.push("profilePhotoUrl");
        if (!internetSpeedScreenshotUrl) missingFields.push("internetSpeedScreenshotUrl");
        if (contactConsent === undefined) missingFields.push("contactConsent"); // Check for presence, not just truthiness

        if (missingFields.length > 0) {
            throw new ApiError(400, `The following fields are required: ${missingFields.join(", ")}`);
        }

        // --- 2. CHECK FOR EXISTING USER ---
        const existingUser = await prisma.user.findUnique({
            where: { email: emailAddress },
        });

        if (existingUser) {
            throw new ApiError(409, "An account with this email already exists.");
        }

        // --- 3. HASH PASSWORD ---
        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log("Password hashed successfully.", hashedPassword); // Debugging log to confirm password hashing

        // --- 4. CREATE USER AND PROFILE IN A TRANSACTION ---
        const newEmployee = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    email: emailAddress,
                    password: hashedPassword,
                    role: UserRole.CONTRACTOR,
                },
            });

            // Helper to ensure a value is an array.
            const toArray = (value) => {
                if (!value) return [];
                return Array.isArray(value) ? value : [value];
            };

            // Helpers for compliance checks
            const safeComplianceChecks = toArray(complianceChecks);
            const safeOtherComplianceChecks = toArray(otherComplianceChecks);
            const hasCompliance = (check) => safeComplianceChecks.includes(check);
            const hasOtherCompliance = (check) => safeOtherComplianceChecks.includes(check);

            // Apply formatting to roleType and verticalSpecialization BEFORE saving
            const formattedRoleType = toArray(roleType).map(formatStringForDatabase);
            const formattedVerticalSpecialization = toArray(verticalSpecialization).map(formatStringForDatabase);


            const profileData = {
                userId: user.id,
                
                // --- SIMPLIFIED DATA ASSIGNMENT ---
                // Directly assign the string/array values from the request body.
                roleType: formattedRoleType, // Use the formatted array
                verticalSpecialization: formattedVerticalSpecialization, // Use the formatted array
                rateRange: hourlyRate,
                englishProficiency: englishProficiency,
                availability: availability,
                otherRoleType: roleTypeOther,
                otherVertical: verticalSpecializationOther,
                yearsExperience: parseInt(yearsExperience, 10),
                skills: toArray(skills),
                remoteTools: toArray(remoteSoftwareTools),
                spokenLanguages: toArray(spokenLanguages),
                otherLanguage: spokenLanguagesOther,
                timezone: timezone === 'Other' ? timezoneOther : timezone,
                country: country === 'Other' ? countryOther : country,
                resumeUrl,
                profilePhotoUrl,
                internetSpeedScreenshotUrl,
                videoIntroductionUrl: videoIntroductionUrl || null,
                portfolioUrl: portfolioUrl || null,
                hipaaCertified: hasCompliance('HIPAA Certified'),
                professionalCertValid: hasCompliance('Professional Certification Validation'),
                signedNda: hasCompliance('Signed NDA'),
                backgroundCheck: hasCompliance('Background Check Completed'),
                criminalRecordCheck: hasCompliance('Criminal Record Check (CRC)'),
                gdprTraining: hasCompliance('GDPR Awareness/Training'),
                pciCompliance: hasCompliance('PCI Compliance Awareness'),
                socialMediaScreening: hasCompliance('Social media/public profile screening'),
                usInsuranceCompliance: hasCompliance('U.S. State Insurance Compliance'),
                canadaInsuranceCompliance: hasCompliance('Canadian Insurance Compliance'),
                willingToSignNda: hasCompliance('Willing to Sign NDA'),
                willingBackgroundCheck: hasCompliance('Willing to Undergo Background Check'),
                willingReferenceCheck: hasCompliance('Willing to Undergo Reference Checks'),
                creditCheck: hasOtherCompliance('Credit check (if applicable)'),
                vulnerableSectorCheck: hasOtherCompliance('Vulnerable sector check (if required for the role)'),
                contactConsent: contactConsent,
            };

            await tx.profile.create({ data: profileData });

            return user;
        });

        // --- 5. PREPARE THE RESPONSE OBJECT ---
        const createdEmployee = await prisma.user.findUnique({
            where: { id: newEmployee.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!createdEmployee) {
            throw new ApiError(500, "Something went wrong while creating the employee profile.");
        }

        // --- 6. GENERATE TOKENS (Assuming this function exists) ---
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdEmployee.id);

        // --- 7. SEND THE FINAL RESPONSE ---
        return res.status(201).json(
            new ApiResponse(
                201,
                { user: createdEmployee, accessToken, refreshToken },
                "Employee registered successfully. Your application is under review."
            )
        );

    } catch (error) {
        console.error("Error during employee registration:", error);
        // Let the asyncHandler manage sending the error response
        throw error;
    }
});

const registerMultipleEmployees = asyncHandler(async (req, res) => {
    try {
        const employeesData = req.body;

        // --- 1. VALIDATE INPUT: Ensure req.body is an array of objects ---
        if (!Array.isArray(employeesData) || employeesData.length === 0) {
            throw new ApiError(400, "Request body must be a non-empty array of employee objects.");
        }

        const createdEmployeeIds = []; // To store IDs of successfully created employees

        // --- 2. PROCESS ALL EMPLOYEES IN A SINGLE TRANSACTION ---
        // Increased the transaction timeout to 30 seconds (30000 ms) to prevent P2028 errors
        await prisma.$transaction(async (tx) => {
            for (const employee of employeesData) {
                // --- 2.1. DESTRUCTURE AND VALIDATE INPUT FOR EACH EMPLOYEE ---
                const {
                    firstName,
                    lastName,
                    emailAddress,
                    password,
                    roleType,
                    roleTypeOther,
                    verticalSpecialization,
                    verticalSpecializationOther,
                    yearsExperience,
                    skills,
                    remoteSoftwareTools,
                    spokenLanguages,
                    spokenLanguagesOther,
                    englishProficiency,
                    hourlyRate,
                    resumeUrl,
                    profilePhotoUrl,
                    internetSpeedScreenshotUrl,
                    videoIntroductionUrl,
                    portfolioUrl,
                    availability,
                    timezone,
                    timezoneOther,
                    country,
                    countryOther,
                    complianceChecks,
                    otherComplianceChecks,
                    contactConsent,
                } = employee;

                // --- Basic Field Validation for each employee ---
                const missingFields = [];
                if (!firstName) missingFields.push("firstName");
                if (!lastName) missingFields.push("lastName");
                if (!emailAddress) missingFields.push("emailAddress");
                if (!password) missingFields.push("password");
                if (!roleType || !Array.isArray(roleType) || roleType.length === 0) missingFields.push("roleType");
                if (!yearsExperience) missingFields.push("yearsExperience");
                if (!englishProficiency) missingFields.push("englishProficiency");
                if (!hourlyRate) missingFields.push("hourlyRate");
                if (!availability) missingFields.push("availability");
                if (!timezone) missingFields.push("timezone");
                if (!country) missingFields.push("country");
                if (!resumeUrl) missingFields.push("resumeUrl");
                if (!profilePhotoUrl) missingFields.push("profilePhotoUrl");
                if (!internetSpeedScreenshotUrl) missingFields.push("internetSpeedScreenshotUrl");
                if (contactConsent === undefined) missingFields.push("contactConsent");

                if (missingFields.length > 0) {
                    // Throwing an error here will rollback the entire transaction
                    throw new ApiError(400, `Employee with email ${emailAddress} is missing required fields: ${missingFields.join(", ")}`);
                }

                // --- 2.2. CHECK FOR EXISTING USER FOR CURRENT EMPLOYEE ---
                const existingUser = await tx.user.findUnique({
                    where: { email: emailAddress },
                });

                if (existingUser) {
                    // Throwing an error here will rollback the entire transaction
                    throw new ApiError(409, `An account with email ${emailAddress} already exists. Cannot register duplicate.`);
                }

                // --- 2.3. HASH PASSWORD ---
                const hashedPassword = await bcrypt.hash(password, 10);

                // --- 2.4. CREATE USER AND PROFILE FOR CURRENT EMPLOYEE ---
                const user = await tx.user.create({
                    data: {
                        firstName,
                        lastName,
                        email: emailAddress,
                        password: hashedPassword,
                        role: UserRole.CONTRACTOR,
                    },
                });

                // Helper to ensure a value is an array.
                const toArray = (value) => {
                    if (!value) return [];
                    return Array.isArray(value) ? value : [value];
                };

                // Helpers for compliance checks
                const safeComplianceChecks = toArray(complianceChecks);
                const safeOtherComplianceChecks = toArray(otherComplianceChecks);
                const hasCompliance = (check) => safeComplianceChecks.includes(check);
                const hasOtherCompliance = (check) => safeOtherComplianceChecks.includes(check);

                // Apply formatting to roleType and verticalSpecialization BEFORE saving
                const formattedRoleType = toArray(roleType).map(formatStringForDatabase);
                const formattedVerticalSpecialization = toArray(verticalSpecialization).map(formatStringForDatabase);

                const profileData = {
                    userId: user.id,
                    roleType: formattedRoleType, // Use the formatted array
                    verticalSpecialization: formattedVerticalSpecialization, // Use the formatted array
                    rateRange: hourlyRate,
                    englishProficiency: englishProficiency,
                    availability: availability,
                    otherRoleType: roleTypeOther,
                    otherVertical: verticalSpecializationOther,
                    yearsExperience: parseInt(yearsExperience, 10),
                    skills: toArray(skills),
                    remoteTools: toArray(remoteSoftwareTools),
                    spokenLanguages: toArray(spokenLanguages),
                    otherLanguage: spokenLanguagesOther,
                    timezone: timezone === 'Other' ? timezoneOther : timezone,
                    country: country === 'Other' ? countryOther : country,
                    resumeUrl,
                    profilePhotoUrl,
                    internetSpeedScreenshotUrl,
                    videoIntroductionUrl: videoIntroductionUrl || null,
                    portfolioUrl: portfolioUrl || null,
                    hipaaCertified: hasCompliance('HIPAA Certified'),
                    professionalCertValid: hasCompliance('Professional Certification Validation'),
                    signedNda: hasCompliance('Signed NDA'),
                    backgroundCheck: hasCompliance('Background Check Completed'),
                    criminalRecordCheck: hasCompliance('Criminal Record Check (CRC)'),
                    gdprTraining: hasCompliance('GDPR Awareness/Training'),
                    pciCompliance: hasCompliance('PCI Compliance Awareness'),
                    socialMediaScreening: hasCompliance('Social media/public profile screening'),
                    usInsuranceCompliance: hasCompliance('U.S. State Insurance Compliance'),
                    canadaInsuranceCompliance: hasCompliance('Canadian Insurance Compliance'),
                    willingToSignNda: hasCompliance('Willing to Sign NDA'),
                    willingBackgroundCheck: hasCompliance('Willing to Undergo Background Check'),
                    willingReferenceCheck: hasCompliance('Willing to Undergo Reference Checks'),
                    creditCheck: hasOtherCompliance('Credit check (if applicable)'),
                    vulnerableSectorCheck: hasOtherCompliance('Vulnerable sector check (if required for the role)'),
                    contactConsent: contactConsent,
                };

                await tx.profile.create({ data: profileData });
                createdEmployeeIds.push(user.id); // Add ID to the list
            }
        }, {
            timeout: 30000 // Set timeout to 30 seconds (default is usually 5 seconds)
        });

        // --- 3. SEND THE FINAL RESPONSE ---
        return res.status(201).json(
            new ApiResponse(
                201,
                { registeredCount: createdEmployeeIds.length, employeeIds: createdEmployeeIds },
                `${createdEmployeeIds.length} employees registered successfully.`
            )
        );

    } catch (error) {
        console.error("Error during multiple employee registration:", error);
        // The ApiError thrown within the transaction will be caught by asyncHandler
        throw error;
    }
});













// /**
//  * @description Register multiple new employees (contractors) with detailed profiles in a single transaction
//  * @route POST /api/v1/users/register-multiple-employees
//  * @access Public (or appropriate for bulk operations)
//  * @param {Array<Object>} req.body - An array of employee objects, each containing the same fields as for single registration.
//  */
// const registerMultipleEmployees = asyncHandler(async (req, res) => {
//     try {
//         const employeesData = req.body;

//         // --- 1. VALIDATE INPUT: Ensure req.body is an array of objects ---
//         if (!Array.isArray(employeesData) || employeesData.length === 0) {
//             throw new ApiError(400, "Request body must be a non-empty array of employee objects.");
//         }

//         const createdEmployeeIds = []; // To store IDs of successfully created employees

//         // --- 2. PROCESS ALL EMPLOYEES IN A SINGLE TRANSACTION ---
//         // Increased the transaction timeout to 30 seconds (30000 ms) to prevent P2028 errors
//         await prisma.$transaction(async (tx) => {
//             for (const employee of employeesData) {
//                 // --- 2.1. DESTRUCTURE AND VALIDATE INPUT FOR EACH EMPLOYEE ---
//                 const {
//                     firstName,
//                     lastName,
//                     emailAddress,
//                     password,
//                     roleType,
//                     roleTypeOther,
//                     verticalSpecialization,
//                     verticalSpecializationOther,
//                     yearsExperience,
//                     skills,
//                     remoteSoftwareTools,
//                     spokenLanguages,
//                     spokenLanguagesOther,
//                     englishProficiency,
//                     hourlyRate,
//                     resumeUrl,
//                     profilePhotoUrl,
//                     internetSpeedScreenshotUrl,
//                     videoIntroductionUrl,
//                     portfolioUrl,
//                     availability,
//                     timezone,
//                     timezoneOther,
//                     country,
//                     countryOther,
//                     complianceChecks,
//                     otherComplianceChecks,
//                     contactConsent,
//                 } = employee;

//                 // --- Basic Field Validation for each employee ---
//                 const missingFields = [];
//                 if (!firstName) missingFields.push("firstName");
//                 if (!lastName) missingFields.push("lastName");
//                 if (!emailAddress) missingFields.push("emailAddress");
//                 if (!password) missingFields.push("password");
//                 if (!roleType || !Array.isArray(roleType) || roleType.length === 0) missingFields.push("roleType");
//                 if (!yearsExperience) missingFields.push("yearsExperience");
//                 if (!englishProficiency) missingFields.push("englishProficiency");
//                 if (!hourlyRate) missingFields.push("hourlyRate");
//                 if (!availability) missingFields.push("availability");
//                 if (!timezone) missingFields.push("timezone");
//                 if (!country) missingFields.push("country");
//                 if (!resumeUrl) missingFields.push("resumeUrl");
//                 if (!profilePhotoUrl) missingFields.push("profilePhotoUrl");
//                 if (!internetSpeedScreenshotUrl) missingFields.push("internetSpeedScreenshotUrl");
//                 if (contactConsent === undefined) missingFields.push("contactConsent");

//                 if (missingFields.length > 0) {
//                     // Throwing an error here will rollback the entire transaction
//                     throw new ApiError(400, `Employee with email ${emailAddress} is missing required fields: ${missingFields.join(", ")}`);
//                 }

//                 // --- 2.2. CHECK FOR EXISTING USER FOR CURRENT EMPLOYEE ---
//                 const existingUser = await tx.user.findUnique({
//                     where: { email: emailAddress },
//                 });

//                 if (existingUser) {
//                     // Throwing an error here will rollback the entire transaction
//                     throw new ApiError(409, `An account with email ${emailAddress} already exists. Cannot register duplicate.`);
//                 }

//                 // --- 2.3. HASH PASSWORD ---
//                 const hashedPassword = await bcrypt.hash(password, 10);

//                 // --- 2.4. CREATE USER AND PROFILE FOR CURRENT EMPLOYEE ---
//                 const user = await tx.user.create({
//                     data: {
//                         firstName,
//                         lastName,
//                         email: emailAddress,
//                         password: hashedPassword,
//                         role: UserRole.CONTRACTOR,
//                     },
//                 });

//                 // Helper to ensure a value is an array.
//                 const toArray = (value) => {
//                     if (!value) return [];
//                     return Array.isArray(value) ? value : [value];
//                 };

//                 // Helpers for compliance checks
//                 const safeComplianceChecks = toArray(complianceChecks);
//                 const safeOtherComplianceChecks = toArray(otherComplianceChecks);
//                 const hasCompliance = (check) => safeComplianceChecks.includes(check);
//                 const hasOtherCompliance = (check) => safeOtherComplianceChecks.includes(check);

//                 const profileData = {
//                     userId: user.id,
//                     roleType: toArray(roleType),
//                     verticalSpecialization: toArray(verticalSpecialization),
//                     rateRange: hourlyRate,
//                     englishProficiency: englishProficiency,
//                     availability: availability,
//                     otherRoleType: roleTypeOther,
//                     otherVertical: verticalSpecializationOther,
//                     yearsExperience: parseInt(yearsExperience, 10),
//                     skills: toArray(skills),
//                     remoteTools: toArray(remoteSoftwareTools),
//                     spokenLanguages: toArray(spokenLanguages),
//                     otherLanguage: spokenLanguagesOther,
//                     timezone: timezone === 'Other' ? timezoneOther : timezone,
//                     country: country === 'Other' ? countryOther : country,
//                     resumeUrl,
//                     profilePhotoUrl,
//                     internetSpeedScreenshotUrl,
//                     videoIntroductionUrl: videoIntroductionUrl || null,
//                     portfolioUrl: portfolioUrl || null,
//                     hipaaCertified: hasCompliance('HIPAA Certified'),
//                     professionalCertValid: hasCompliance('Professional Certification Validation'),
//                     signedNda: hasCompliance('Signed NDA'),
//                     backgroundCheck: hasCompliance('Background Check Completed'),
//                     criminalRecordCheck: hasCompliance('Criminal Record Check (CRC)'),
//                     gdprTraining: hasCompliance('GDPR Awareness/Training'),
//                     pciCompliance: hasCompliance('PCI Compliance Awareness'),
//                     socialMediaScreening: hasCompliance('Social media/public profile screening'),
//                     usInsuranceCompliance: hasCompliance('U.S. State Insurance Compliance'),
//                     canadaInsuranceCompliance: hasCompliance('Canadian Insurance Compliance'),
//                     willingToSignNda: hasCompliance('Willing to Sign NDA'),
//                     willingBackgroundCheck: hasCompliance('Willing to Undergo Background Check'),
//                     willingReferenceCheck: hasCompliance('Willing to Undergo Reference Checks'),
//                     creditCheck: hasOtherCompliance('Credit check (if applicable)'),
//                     vulnerableSectorCheck: hasOtherCompliance('Vulnerable sector check (if required for the role)'),
//                     contactConsent: contactConsent,
//                 };

//                 await tx.profile.create({ data: profileData });
//                 createdEmployeeIds.push(user.id); // Add ID to the list
//             }
//         }, {
//             timeout: 30000 // Set timeout to 30 seconds (default is usually 5 seconds)
//         });

//         // --- 3. SEND THE FINAL RESPONSE ---
//         return res.status(201).json(
//             new ApiResponse(
//                 201,
//                 { registeredCount: createdEmployeeIds.length, employeeIds: createdEmployeeIds },
//                 `${createdEmployeeIds.length} employees registered successfully.`
//             )
//         );

//     } catch (error) {
//         console.error("Error during multiple employee registration:", error);
//         // The ApiError thrown within the transaction will be caught by asyncHandler
//         throw error;
//     }
// });







// /**
//  * @description Register a new employee (contractor) with a detailed profile
//  * @route POST /api/v1/users/register-employee
//  * @access Public
//  */
// const registerEmployee = asyncHandler(async (req, res) => {
//     try {

//         // Helper function to convert a slug (e.g., 'dental-admin' or 'it_support')
//         // to Title Case (e.g., 'Dental Admin' or 'IT Support').
//         const formatStringForDatabase = (str) => {
//             if (!str) return '';
//             // Replace hyphens and underscores with spaces, then title case each word
//             return str.replace(/[-_]/g, ' ')
//                       .split(' ')
//                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//                       .join(' ');
//         };
//         // --- 1. DESTRUCTURE AND VALIDATE INPUT ---
//         const {
//             firstName,
//             lastName,
//             emailAddress,
//             password,
//             roleType,
//             roleTypeOther,
//             verticalSpecialization,
//             verticalSpecializationOther,
//             yearsExperience,
//             skills,
//             remoteSoftwareTools,
//             spokenLanguages,
//             spokenLanguagesOther,
//             englishProficiency,
//             hourlyRate,
//             resumeUrl,
//             profilePhotoUrl,
//             internetSpeedScreenshotUrl,
//             videoIntroductionUrl,
//             portfolioUrl,
//             availability,
//             timezone,
//             timezoneOther,
//             country,
//             countryOther,
//             complianceChecks,
//             otherComplianceChecks,
//             contactConsent,
//         } = req.body;

//         // console.log("Registering employee with data:"); // Debugging log to see incoming data

//         // --- Basic Field Validation ---
//         const missingFields = [];
//         if (!firstName) missingFields.push("firstName");
//         if (!lastName) missingFields.push("lastName");
//         if (!emailAddress) missingFields.push("emailAddress");
//         if (!password) missingFields.push("password");
//         if (!roleType || !Array.isArray(roleType) || roleType.length === 0) missingFields.push("roleType");
//         if (!yearsExperience) missingFields.push("yearsExperience");
//         if (!englishProficiency) missingFields.push("englishProficiency");
//         if (!hourlyRate) missingFields.push("hourlyRate");
//         if (!availability) missingFields.push("availability");
//         if (!timezone) missingFields.push("timezone");
//         if (!country) missingFields.push("country");
//         if (!resumeUrl) missingFields.push("resumeUrl");
//         if (!profilePhotoUrl) missingFields.push("profilePhotoUrl");
//         if (!internetSpeedScreenshotUrl) missingFields.push("internetSpeedScreenshotUrl");
//         if (contactConsent === undefined) missingFields.push("contactConsent"); // Check for presence, not just truthiness

//         if (missingFields.length > 0) {
//             throw new ApiError(400, `The following fields are required: ${missingFields.join(", ")}`);
//         }

//         // --- 2. CHECK FOR EXISTING USER ---
//         const existingUser = await prisma.user.findUnique({
//             where: { email: emailAddress },
//         });

//         if (existingUser) {
//             throw new ApiError(409, "An account with this email already exists.");
//         }

//         // --- 3. HASH PASSWORD ---
//         const hashedPassword = await bcrypt.hash(password, 10);
//         // console.log("Password hashed successfully.", hashedPassword); // Debugging log to confirm password hashing

//         // --- 4. CREATE USER AND PROFILE IN A TRANSACTION ---
//         const newEmployee = await prisma.$transaction(async (tx) => {
//             const user = await tx.user.create({
//                 data: {
//                     firstName,
//                     lastName,
//                     email: emailAddress,
//                     password: hashedPassword,
//                     role: UserRole.CONTRACTOR,
//                 },
//             });

//             // Helper to ensure a value is an array.
//             const toArray = (value) => {
//                 if (!value) return [];
//                 return Array.isArray(value) ? value : [value];
//             };

//             // Helpers for compliance checks
//             const safeComplianceChecks = toArray(complianceChecks);
//             const safeOtherComplianceChecks = toArray(otherComplianceChecks);
//             const hasCompliance = (check) => safeComplianceChecks.includes(check);
//             const hasOtherCompliance = (check) => safeOtherComplianceChecks.includes(check);

//             // Apply formatting to roleType and verticalSpecialization BEFORE saving
//             const formattedRoleType = toArray(roleType).map(formatStringForDatabase);
//             const formattedVerticalSpecialization = toArray(verticalSpecialization).map(formatStringForDatabase);

//             const profileData = {
//                 userId: user.id,
                
//                 // --- SIMPLIFIED DATA ASSIGNMENT ---
//                 // Directly assign the string/array values from the request body.
//                 roleType: formattedRoleType, // Use the formatted array
//                 verticalSpecialization: formattedVerticalSpecialization, // Use the formatted array
//                 rateRange: hourlyRate,
//                 englishProficiency: englishProficiency,
//                 availability: availability,
//                 otherRoleType: roleTypeOther,
//                 otherVertical: verticalSpecializationOther,
//                 yearsExperience: parseInt(yearsExperience, 10),
//                 skills: toArray(skills),
//                 remoteTools: toArray(remoteSoftwareTools),
//                 spokenLanguages: toArray(spokenLanguages),
//                 otherLanguage: spokenLanguagesOther,
//                 timezone: timezone === 'Other' ? timezoneOther : timezone,
//                 country: country === 'Other' ? countryOther : country,
//                 resumeUrl,
//                 profilePhotoUrl,
//                 internetSpeedScreenshotUrl,
//                 videoIntroductionUrl: videoIntroductionUrl || null,
//                 portfolioUrl: portfolioUrl || null,
//                 hipaaCertified: hasCompliance('HIPAA Certified'),
//                 professionalCertValid: hasCompliance('Professional Certification Validation'),
//                 signedNda: hasCompliance('Signed NDA'),
//                 backgroundCheck: hasCompliance('Background Check Completed'),
//                 criminalRecordCheck: hasCompliance('Criminal Record Check (CRC)'),
//                 gdprTraining: hasCompliance('GDPR Awareness/Training'),
//                 pciCompliance: hasCompliance('PCI Compliance Awareness'),
//                 socialMediaScreening: hasCompliance('Social media/public profile screening'),
//                 usInsuranceCompliance: hasCompliance('U.S. State Insurance Compliance'),
//                 canadaInsuranceCompliance: hasCompliance('Canadian Insurance Compliance'),
//                 willingToSignNda: hasCompliance('Willing to Sign NDA'),
//                 willingBackgroundCheck: hasCompliance('Willing to Undergo Background Check'),
//                 willingReferenceCheck: hasCompliance('Willing to Undergo Reference Checks'),
//                 creditCheck: hasOtherCompliance('Credit check (if applicable)'),
//                 vulnerableSectorCheck: hasOtherCompliance('Vulnerable sector check (if required for the role)'),
//                 contactConsent: contactConsent,
//             };

//             await tx.profile.create({ data: profileData });

//             return user;
//         });

//         // --- 5. PREPARE THE RESPONSE OBJECT ---
//         const createdEmployee = await prisma.user.findUnique({
//             where: { id: newEmployee.id },
//             select: {
//                 id: true,
//                 email: true,
//                 firstName: true,
//                 lastName: true,
//                 role: true,
//                 createdAt: true,
//                 profile: true,
//             },
//         });

//         if (!createdEmployee) {
//             throw new ApiError(500, "Something went wrong while creating the employee profile.");
//         }

//         // --- 6. GENERATE TOKENS (Assuming this function exists) ---
//         const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdEmployee.id);

//         // --- 7. SEND THE FINAL RESPONSE ---
//         return res.status(201).json(
//             new ApiResponse(
//                 201,
//                 { user: createdEmployee, accessToken, refreshToken },
//                 "Employee registered successfully. Your application is under review."
//             )
//         );

//     } catch (error) {
//         console.error("Error during employee registration:", error);
//         // Let the asyncHandler manage sending the error response
//         throw error;
//     }
// });






const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
            }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        // Calculate ACCESS_TOKEN_EXPIRY in milliseconds for consistency if needed,
        // but jwt.sign handles string formats like "1h", "7d" directly.
        const accessToken = jwt.sign(
            {
                _id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: fullName,
                phoneNumber: user.phoneNumber,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );

        // Calculate REFRESH_TOKEN_EXPIRY in milliseconds for the expiresAt field
        let refreshTokenExpiryMs;
        const expiryString = process.env.REFRESH_TOKEN_EXPIRY;
        if (expiryString.endsWith('d')) {
            refreshTokenExpiryMs = parseInt(expiryString) * 24 * 60 * 60 * 1000; // days to milliseconds
        } else if (expiryString.endsWith('h')) {
            refreshTokenExpiryMs = parseInt(expiryString) * 60 * 60 * 1000; // hours to milliseconds
        } else if (expiryString.endsWith('m')) {
            refreshTokenExpiryMs = parseInt(expiryString) * 60 * 1000; // minutes to milliseconds
        } else if (expiryString.endsWith('s')) {
            refreshTokenExpiryMs = parseInt(expiryString) * 1000; // seconds to milliseconds
        } else {
            // Default to 7 days if format is unexpected, or throw an error
            console.warn("REFRESH_TOKEN_EXPIRY format not recognized, defaulting to 7 days.");
            refreshTokenExpiryMs = 7 * 24 * 60 * 60 * 1000;
        }

        const refreshToken = jwt.sign(
            {
                _id: user.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: expiryString // Use the string format for JWT signing
            }
        );

        // Calculate the exact expiration date for the database field
        const expiresAt = new Date(Date.now() + refreshTokenExpiryMs);

        // Store the refresh token in the dedicated RefreshToken model
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: expiresAt, // <--- THIS IS THE MISSING FIELD!
            }
        });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
};



const registerUser = asyncHandler(async (req, res) => {
    try {
        // console.log("Registering user with data:", req.body); // Debugging log to see incoming data
        // Destructure the required fields from req.body
        const { email, password, firstName, lastName, role, phoneNumber } = req.body;

        // 1. Validation (add more robust validation)
        const missingFields = [];
        if (!email) missingFields.push("email");
        if (!password) missingFields.push("password");
        if (!firstName) missingFields.push("firstName");
        if (!lastName) missingFields.push("lastName");
        if (!role) missingFields.push("role");

        if (missingFields.length > 0) {
            throw new ApiError(400, `The following fields are required: ${missingFields.join(", ")}`);
        }

        // Validate the role against the UserRole enum
        if (!Object.values(UserRole).includes(role)) { // More robust check
            throw new ApiError(400, "Invalid user role specified");
        }

        // 2. Check if user already exists by email
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            throw new ApiError(409, "User with this email already exists");
        }

        // 2a. Check if user already exists by phone number (if provided and unique)
        if (phoneNumber) {
            const existingUserByPhone = await prisma.user.findUnique({ where: { phoneNumber } });
            if (existingUserByPhone) {
                throw new ApiError(409, "User with this phone number already exists");
            }
        }

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create the user in the database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Use the hashed password
                firstName,
                lastName,
                phoneNumber, // Pass the optional phone number
                role
            }
        });

        // 5. If the user is a contractor, create an empty profile for them
        if (user.role === UserRole.CONTRACTOR) {
            await prisma.profile.create({
                data: {
                    userId: user.id
                    // All other profile fields will be null/default based on your Profile model
                }
            });
        }

        // 6. Remove password from the response object and select only necessary fields
        const createdUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true, // Include phone number in the response
                role: true,
                createdAt: true,
                // Exclude password and refreshToken from the response
            }
        });

        if (!createdUser) {
            throw new ApiError(500, "User registration failed. Please try again.");
        }

        // 7. Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser.id);

        // 8. Send the response with user data and tokens
        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                },
                "User registered successfully"
            )
        );
    } catch (error) {
        // This catch block will specifically handle errors that occur within this function
        // before they are caught by the asyncHandler utility.
        // It's good for logging or specific pre-processing.
        console.error("Error during user registration:", error);

        // Re-throw the error so asyncHandler can process it and send a standardized API error response.
        // If it's already an ApiError, re-throw it. Otherwise, wrap it in a generic ApiError.
        if (error instanceof ApiError) {
            throw error;
        } else {
            throw new ApiError(500, "An unexpected error occurred during registration.");
        }
    }
});




const loginUser = asyncHandler(async (req, res) => {
    try {
        // 1. Get user credentials from req.body
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        // 2. Find user in DB by email
        const user = await prisma.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                password: true, // <--- ADD THIS LINE!
            }
        });

        if (!user) {
            throw new ApiError(404, "User with this email does not exist");
        }

        // 3. Compare password with hashed password
        // Now, `user.password` will actually contain the hashed password from the DB
        // So, this check will correctly identify users truly without a password (e.g., social logins)
        // or allow bcrypt.compare to run if a password exists.
        if (!user.password) { // This check is still good to differentiate social vs. local
            throw new ApiError(401, "Account set up without password. Please use social login.");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        // 4. Generate access and refresh tokens (JWT)
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

        // 5. Send tokens in response
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds (adjust as needed)
        };

        // It's generally good practice to remove the password from the `user` object
        // before sending it back in the response for security reasons.
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;

        return res
            .status(200)
            // .cookie("accessToken", accessToken, options)
            // .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: userWithoutPassword, // Send user object without password
                        accessToken,
                        refreshToken
                    },
                    "User logged in successfully"
                )
            );
    } catch (error) {
        console.error("Error during user login:", error);

        if (error instanceof ApiError) {
            throw error;
        } else {
            throw new ApiError(500, "An unexpected error occurred during login.", error.message);
        }
    }
});




export {
    registerUser,
    loginUser,
    registerEmployee,
    registerMultipleEmployees
};