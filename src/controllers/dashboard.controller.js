// src/controllers/dashboard.controller.js

import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Assuming this path to your Prisma client instance

/**
 * @description Fetches a list of employees hired by the authenticated client.
 * @route POST /api/v1/users/hired-employees
 * @access Protected (requires client authentication)
 */
const getHiredEmployeesForClient = asyncHandler(async (req, res) => {

    // console.log("Fetching hired employees for client:", req.user);
    // Ensure the user is authenticated and has the 'CLIENT' role
    if (!req.user || req.user.role !== UserRole.CLIENT) {
        throw new ApiError(403, "Unauthorized: Only clients can view hired employees.");
    }

    const clientId = req.user.id; // Get the ID of the authenticated client

    try {
        // --- CHANGE STARTS HERE ---
        // Find all ClientContractor records where the current user is the client
        const clientContracts = await prisma.clientContractor.findMany({ // <--- Changed from 'hiring' to 'clientContractor'
            where: {
                clientId: clientId,
                // You can add more filters here, e.g., to only show 'active' contracts:
                // active: true,
            },
            include: {
                contractor: { // <--- Changed from 'employee' to 'contractor'
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profile: { // Include the contractor's Profile
                            select: {
                                roleType: true,
                                // You might want other profile fields here if needed on the dashboard card
                                profilePhotoUrl: true, // Example: for displaying an avatar
                            }
                        }
                    }
                }
            },
            orderBy: {
                hiredAt: 'desc' // <--- Changed from 'startDate' to 'hiredAt'
            }
        });

        // Format the data to match the frontend's expected structure
        // The frontend expects: { id, firstName, lastName, profile.roleType, profile.finalCost, status }
        const formattedEmployees = clientContracts.map(contract => ({
            id: contract.contractor.id, // ID of the contractor
            firstName: contract.contractor.firstName,
            lastName: contract.contractor.lastName,
            profile: {
                // Assuming roleType is an array, take the first one or adjust to join them
                roleType: contract.contractor.profile?.roleType[0] || 'N/A',
                // Map paymentAmount from ClientContractor to finalCost for frontend
                finalCost: contract.paymentAmount || 0,
                profilePhotoUrl: contract.contractor.profile?.profilePhotoUrl // Example
            },
            // Map 'active' boolean to a more descriptive string 'status'
            status: contract.active ? 'ACTIVE' : (contract.endedAt ? 'COMPLETED' : 'PENDING'), // Enhanced status logic
            // You can also include other contract-specific details if the frontend needs them
            hiredAt: contract.hiredAt,
            endedAt: contract.endedAt,
            paymentStatus: contract.paymentStatus,
        }));
        // --- CHANGE ENDS HERE ---

        if (!formattedEmployees || formattedEmployees.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "No employees hired yet by this client.")
            );
        }
        // console.log("Hired employees fetched successfully for client:", formattedEmployees);

        return res.status(200).json(
            new ApiResponse(
                200,
                { employees: formattedEmployees }, // Wrap in 'employees' array as frontend expects
                "Hired employees fetched successfully."
            )
        );

    } catch (error) {
        console.error("Error fetching hired employees for client:", error);
        if (error instanceof ApiError) {
            throw error; // Re-throw custom API errors
        }
        throw new ApiError(
            500,
            "An error occurred while fetching hired employees.",
            error.message
        );
    }
});

export {
    getHiredEmployeesForClient,
};