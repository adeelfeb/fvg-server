import { UserRole } from '@prisma/client'; // Keep this, it's correct for the enum
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Assuming these are correctly set up and exported from their respective paths
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Using the centralized prisma instance


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            // Select specific fields for the token payload
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true, // Include optional phone number
            }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Construct a 'fullName' for the token if desired, or use firstName/lastName directly
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        // Ensure ACCESS_TOKEN_SECRET and ACCESS_TOKEN_EXPIRY are defined in your .env
        const accessToken = jwt.sign(
            {
                _id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: fullName, // Add fullName derived from firstName/lastName
                phoneNumber: user.phoneNumber, // Include optional phone number
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );

        // Ensure REFRESH_TOKEN_SECRET and REFRESH_TOKEN_EXPIRY are defined in your .env
        const refreshToken = jwt.sign(
            {
                _id: user.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );

        // Update the user's refresh token in the database
        // Assuming your User model has a refreshToken field
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
            }
        });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Error generating tokens:", error); // Log the actual error for debugging
        // Re-throw as ApiError to be caught by asyncHandler
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
};


const registerUser = asyncHandler(async (req, res) => {
    try {
        console.log("Registering user with data:", req.body); // Debugging log to see incoming data
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
    // 1. Get user credentials from req.body
    const { email, password } = req.body; // No need for phoneNumber in login req.body, as we're logging in by email/password

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 2. Find user in DB by email
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
    }

    // 3. Compare password with hashed password
    // Ensure that `user.password` is not null for non-social logins before comparing
    if (!user.password) {
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

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber, // Include optional phone number in response
                        role: user.role, // Include user role in response
                        // Removed 'username', 'fullName', 'avatar' as they are not directly in your provided model
                    },
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});




export {
    registerUser,
    loginUser
};