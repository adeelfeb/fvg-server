// admin.controller.js

import {
    UserRole // Assuming UserRole is imported from @prisma/client
} from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js';

/**
 * @description Controller to update the VPC unit price in the database.
 * This function expects `unitPrice` (as a number) and optionally `currency` in the request body.
 * It will deactivate any currently active VPC price and create a new active record.
 * @param {Object} req - Express request object (expected to have req.user from verifyJWT/verifyAdmin)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateVpcPrice = asyncHandler(async (req, res) => {
    try {
        // console.log("Updating VPC price with request body:", req.body);
        const { unitPrice, currency = 'usd' } = req.body; // Default currency to 'usd'
        // console.log("Received unitPrice:", unitPrice, "currency:", currency);
        if (unitPrice === undefined || unitPrice === null || typeof unitPrice !== 'number' || unitPrice < 0) {
            throw new ApiError(400, "Invalid or missing 'unitPrice'. It must be a non-negative number.");
        }

        // 1. Validate Input
        if (unitPrice === undefined || unitPrice === null || typeof unitPrice !== 'number' || unitPrice < 0) {
            throw new ApiError(400, "Invalid or missing 'unitPrice'. It must be a non-negative number.");
        }

        // Convert unitPrice to cents (integer) for database storage
        const unitPriceInCents = Math.round(unitPrice * 100);

        // 2. Perform the update in a transaction
        const updatedVpcPrice = await prisma.$transaction(async (tx) => {
            // Deactivate any currently active VPC pricing records
            await tx.vpcPricing.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });

            // Create a new VPC pricing record with the new price, marked as active
            const newPrice = await tx.vpcPricing.create({
                data: {
                    unitPrice: unitPriceInCents,
                    currency: currency.toLowerCase(), // Store currency in lowercase
                    isActive: true,
                },
            });
            return newPrice;
        });

        // 3. Send Success Response
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    id: updatedVpcPrice.id,
                    unitPrice: updatedVpcPrice.unitPrice / 100, // Convert back to dollars for response
                    currency: updatedVpcPrice.currency,
                    isActive: updatedVpcPrice.isActive,
                    createdAt: updatedVpcPrice.createdAt,
                },
                "VPC unit price updated successfully."
            )
        );

    } catch (error) {
        console.error("Error updating VPC price:", error);
        // Let the asyncHandler manage sending the error response
        throw error;
    }
});


export {
    updateVpcPrice // Export the new function
    // ... other exported functions
};