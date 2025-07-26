// src/controllers/dashboard.controller.js

import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Assuming this path to your Prisma client instance

const saveEmployeesForClient = asyncHandler(async (req, res) => {
    const clientId = req.user.id; // Authenticated client
    const { employeeId } = req.body;

    if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required.' });
    }

    // Optional: Check if the user is a CLIENT
    if (req.user.role !== 'CLIENT') {
        return res.status(403).json({ message: 'Only clients can save employees.' });
    }

    try {
        // Attempt to create a new like
        const saved = await prisma.likedContractor.create({
            data: {
                clientId: clientId,
                contractorId: employeeId,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Employee saved successfully.',
            data: saved,
        });
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'You have already saved this employee.',
            });
        }

        console.error('Error saving employee:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while saving employee.',
        });
    }
});

const unsaveEmployeesForClient = asyncHandler(async (req, res) => {
    const clientId = req.user.id; // Authenticated client
    const { employeeId } = req.body;

    if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required.' });
    }

    // Optional: Check if the user is a CLIENT
    if (req.user.role !== UserRole.CLIENT) {
        return res.status(403).json({ message: 'Only clients can unsave employees.' });
    }

    try {
        // First check if the record exists
        const existing = await prisma.likedContractor.findUnique({
            where: {
                clientId_contractorId: {
                    clientId: clientId,
                    contractorId: employeeId,
                },
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'This employee is not in your saved list.',
            });
        }

        // Delete the saved record
        await prisma.likedContractor.delete({
            where: {
                clientId_contractorId: {
                    clientId: clientId,
                    contractorId: employeeId,
                },
            },
        });
        // console.log(`Employee with ID ${employeeId} unsaved successfully for client ${clientId}.`);

        return res.status(200).json({
            success: true,
            message: 'Employee removed from saved list successfully.',
        });
    } catch (error) {
        console.error('Error unsaving employee:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while unsaving employee.',
        });
    }
});

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


const getSavedEmployeesForClient = asyncHandler(async (req, res) => {
    const clientId = req.user.id;

    // Optional: Restrict access to CLIENT only
    if (req.user.role !== 'CLIENT') {
        return res.status(403).json({ message: 'Only clients can view saved employees.' });
    }

    try {
        // Fetch saved contractors
        const savedEmployees = await prisma.likedContractor.findMany({
            where: {
                clientId: clientId,
            },
            include: {
                contractor: true, // this assumes you have a relation defined in Prisma schema
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Fetched saved employees successfully.',
            data: savedEmployees,
        });
    } catch (error) {
        console.error('Error fetching saved employees:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while fetching saved employees.',
        });
    }
});




export {
    getHiredEmployeesForClient,
    saveEmployeesForClient,
    unsaveEmployeesForClient,
    getSavedEmployeesForClient
};