import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Your Prisma client
import Stripe from 'stripe';
import { UserRole } from '@prisma/client'; // Import UserRole if you need it for employee type checking



/**
 * @description TEMPORARY: Mocks a successful Stripe checkout session completion
 * and triggers the database fulfillment logic directly for testing purposes.
 * This function should be removed or commented out in production.
 * @route POST /api/v1/stripe/mock-fulfill
 * @access Protected (requires verifyJWT middleware to get req.user.id)
 * @param {string} req.body.employeeId - The ID of the contractor to "hire".
 * @param {number} req.body.vpcCount - The number of VPCs to "purchase".
 * @param {string} req.user.id - The ID of the authenticated client user.
 */
const mockFulfillPayment = asyncHandler(async (req, res) => {
    console.warn("--- MOCK PAYMENT FULFILLMENT TRIGGERED (DEVELOPMENT ONLY) ---");
    const { employeeId, vpcCount,  } = req.body;
    const userId = req.user?.id; // The client making the "purchase"

    if (!userId) {
        throw new ApiError(401, "User not authenticated for mock fulfillment.");
    }
    if (!employeeId) {
        throw new ApiError(400, "Employee ID is required for mock fulfillment.");
    }
    if (vpcCount === undefined || typeof vpcCount !== 'number' || vpcCount < 0) {
        throw new ApiError(400, "Valid VPC count (non-negative number) is required for mock fulfillment.");
    }

    // Simulate the Stripe Checkout Session object structure
    const mockSession = {
        client_reference_id: userId,
        payment_status: 'paid',
        amount_total: 10000, // Example: 10000 cents = $100.00 (adjust as needed for testing)
        currency: 'usd',
        id: `mock_cs_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Unique mock session ID
        payment_intent: `mock_pi_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Unique mock payment intent ID
        metadata: {
            userId: userId,
            employeeId: employeeId,
            vpcCount: String(vpcCount), // Stripe metadata values are always strings
        },
    };

    // console.log("Mock Session Data:", mockSession);

    try {
        // --- Fulfillment Logic (Copied directly from stripeWebhookHandler's checkout.session.completed case) ---

        // Idempotency Check for Payment Record
        const existingPayment = await prisma.payment.findUnique({
            where: { stripeSessionId: mockSession.id }
        });

        if (existingPayment && existingPayment.status === 'paid') {
            // console.warn(`Mock payment for session ${mockSession.id} already processed. Skipping fulfillment.`);
            return res.status(200).json({ success: true, message: "Mock payment already processed (idempotent)." });
        }

        // 1. Create/Update ClientContractor relationship
        try {
            const clientContractorRecord = await prisma.clientContractor.upsert({
                where: {
                    clientId_contractorId: { // Targets the @@unique constraint
                        clientId: userId,
                        contractorId: employeeId, // Use employeeId directly from request body/metadata
                    }
                },
                update: {
                    active: true,
                    endedAt: null, // Reactivate if it was ended
                    paymentIntentId: mockSession.payment_intent,
                    paymentAmount: mockSession.amount_total / 100, // Convert to dollars
                    paymentStatus: mockSession.payment_status,
                    hiredAt: new Date(), // Update hire timestamp if re-hired
                },
                create: {
                    clientId: userId,
                    contractorId: employeeId,
                    paymentIntentId: mockSession.payment_intent,
                    paymentAmount: mockSession.amount_total / 100,
                    paymentStatus: mockSession.payment_status,
                    active: true,
                },
            });
            // console.log(`Mock: Client ${userId} successfully ${clientContractorRecord.id ? 'updated' : 'hired'} contractor ${employeeId}.`);
        } catch (dbError) {
            console.error(`Mock: Error upserting ClientContractor record for client ${userId} and contractor ${employeeId}:`, dbError);
            // Log this, but don't prevent further fulfillment steps if possible
        }


        // 2. Add VPC credits to the user (Client)
        if (vpcCount > 0) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        // Make sure your User model has a `vpcCredits` field (Int)
                        vpcCredits: {
                            increment: vpcCount,
                        },
                    },
                });
                // console.log(`Mock: User ${userId} received ${vpcCount} VPC credits.`);
            } catch (dbError) {
                console.error(`Mock: Error updating VPC credits for user ${userId}:`, dbError);
                // Log this
            }
        }

        // 3. Record the payment in your database (for auditing)
        try {
            await prisma.payment.create({
                data: {
                    userId: userId,
                    stripeSessionId: mockSession.id,
                    stripePaymentIntentId: mockSession.payment_intent,
                    amount: mockSession.amount_total,
                    currency: mockSession.currency,
                    status: mockSession.payment_status,
                    description: `MOCK: Purchase of employee profile (${employeeId}) and ${vpcCount} VPCs`,
                    // If your Payment model has a Json? metadata field:
                    // metadata: mockSession.metadata,
                }
            });
            // console.log(`Mock: Payment record created for session ${mockSession.id}.`);
        } catch (dbError) {
            console.error(`Mock: Error creating Payment record for session ${mockSession.id}:`, dbError);
            // Log this
        }

        console.warn("--- MOCK PAYMENT FULFILLMENT COMPLETED ---");
        res.status(200).json({ success: true, message: "Mock fulfillment successful!" });

    } catch (error) {
        console.error("Critical error during mock fulfillment:", error);
        throw new ApiError(500, "Mock fulfillment failed due to an internal error.", error.message);
    }
});





export {
    mockFulfillPayment
};
