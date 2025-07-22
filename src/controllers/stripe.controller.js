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
    const { employeeId, vpcCount } = req.body;
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



// Initialize Stripe with your secret key
// Ensure process.env.STRIPE_SECRET_KEY is loaded (e.g., using dotenv)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Use a recent API version
});

/**
 * @description Creates a Stripe Checkout Session for one-time payments, fetching prices from DB.
 * @route POST /api/v1/stripe/create-checkout-session
 * @access Protected (assumes verifyJWT middleware is used to populate req.user)
 * @param {string} req.body.employeeId - The ID of the employee whose profile is being purchased.
 * @param {number} req.body.vpcCount - The quantity of VPC (Virtual Private Cloud) units being purchased.
 * @param {string} req.user.id - The ID of the authenticated user (from verifyJWT middleware)
 */
const createCheckoutSession = asyncHandler(async (req, res) => {
    // console.log("Creating Stripe Checkout Session...", req.body);
    // console.log("Authenticated user:", req.user);

    const { employeeId, vpcCount } = req.body; // Extract employeeId and vpcCount
    const userId = req.user?.id; // Assuming req.user is populated by verifyJWT

    // --- Input Validation ---
    if (!employeeId) {
        throw new ApiError(400, "Employee ID is required for checkout.");
    }
    if (vpcCount === undefined || typeof vpcCount !== 'number' || vpcCount < 0) {
        throw new ApiError(400, "Valid VPC count (non-negative number) is required.");
    }
    if (!userId) {
        throw new ApiError(401, "User not authenticated for checkout session creation.");
    }

    try {
        const lineItems = [];

        // 1. Fetch Employee's Final Cost
        const employee = await prisma.user.findUnique({
            where: {
                id: employeeId,
                // Optional: Ensure the employee is a CONTRACTOR if your logic requires
                // role: UserRole.CONTRACTOR,
            },
            select: {
                firstName: true,
                lastName: true,
                profile: {
                    select: {
                        finalCost: true, // Assuming this is the direct cost for buying the profile
                    },
                },
            },
        });

        // if (!employee || !employee.profile || employee.profile.finalCost === null) {
        if (!employee || !employee.profile ) {
            throw new ApiError(404, "Employee profile or final cost not found.");
        }

        const employeeCost = 20 || parseFloat(employee.profile.finalCost); // Ensure it's a number
        if (isNaN(employeeCost) || employeeCost <= 0) {
            throw new ApiError(400, "Invalid or zero employee final cost found in profile.");
        }

        // Add employee profile cost as a line item
        lineItems.push({
            price_data: {
                currency: 'usd', // Use your desired currency
                product_data: {
                    name: `${employee.firstName} ${employee.lastName}'s Profile`,
                    description: `Access to ${employee.firstName} ${employee.lastName}'s contact and detailed profile information.`,
                    // images: [], // Add employee profile image URL if available
                },
                unit_amount: Math.round(employeeCost * 100), // Convert to cents
            },
            quantity: 1, // Always 1 for buying a profile
        });

        // 2. Fetch VPC Unit Price
        // Find the currently active VPC pricing
        const activeVpcPrice = await prisma.vpcPricing.findFirst({
            where: {
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc', // Get the most recently active one
            },
        });

        if (!activeVpcPrice) {
            throw new ApiError(500, "VPC unit price not configured. Please contact support.");
        }

        const vpcUnitPrice = parseFloat(activeVpcPrice.unitPrice); // Assuming unitPrice is stored as a number (e.g., float)
        if (isNaN(vpcUnitPrice) || vpcUnitPrice <= 0) {
            throw new ApiError(500, "Invalid VPC unit price found in configuration.");
        }

        if (vpcCount > 0) {
            // Add VPCs as a line item if quantity is greater than 0
            lineItems.push({
                price_data: {
                    currency: activeVpcPrice.currency || 'usd', // Use currency from DB if available, else default
                    product_data: {
                        name: `Virtual Private Call (VPC) Units`,
                        description: `Bundle of ${vpcCount} VPC units for communication.`,
                    },
                    unit_amount: Math.round(vpcUnitPrice * 100), // Convert to cents
                },
                quantity: vpcCount,
            });
        }
        
        // --- Important: Ensure lineItems is not empty after fetching prices ---
        if (lineItems.length === 0) {
            throw new ApiError(400, "No items to purchase. Please select an employee and/or VPCs.");
        }

        // Create a new checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: process.env.STRIPE_CANCEL_URL,
            customer_email: req.user.email,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                employeeId: employeeId, // Store employee ID in metadata for later use in webhook
                vpcCount: vpcCount,     // Store VPC count in metadata
                // You could also stringify the entire lineItems array if needed, but keep it small
            },
        });

        // Respond with the session URL
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { sessionId: session.id, url: session.url },
                    "Stripe Checkout Session created successfully"
                )
            );

    } catch (error) {
        console.error("Error creating Stripe Checkout Session:", error);
        if (error instanceof ApiError) {
            throw error;
        } else {
            // For unexpected errors, provide a generic message to the user
            throw new ApiError(500, "Failed to create checkout session due to an internal error.", error.message);
        }
    }
});


/**
 * @description Handles Stripe webhook events.
 * @route POST /api/v1/stripe/webhook
 * @access Public (Stripe calls this endpoint)
 * This endpoint must be able to receive raw body, not JSON parsed.
 */
const stripeWebhookHandler = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        // Return 400 immediately for bad signature
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout Session Completed:', session);

            const userId = session.client_reference_id; // This is the CLIENT's ID
            const paymentStatus = session.payment_status; // Should be 'paid'
            const totalAmount = session.amount_total; // Total amount in cents
            const currency = session.currency;
            const stripeSessionId = session.id;
            const stripePaymentIntentId = session.payment_intent; // Get the payment intent ID if available

            // Retrieve metadata we stored
            const purchasedEmployeeId = session.metadata.employeeId; // This is the CONTRACTOR's ID
            const purchasedVpcCount = parseInt(session.metadata.vpcCount, 10);

            try {
                // --- Idempotency Check for Payment Record ---
                // We're creating a Payment record for every successful session.
                // If a record with this stripeSessionId already exists and is paid,
                // it means we've already processed this fulfillment.
                const existingPayment = await prisma.payment.findUnique({
                    where: { stripeSessionId: stripeSessionId }
                });

                if (existingPayment && existingPayment.status === 'paid') {
                    console.warn(`Payment for session ${stripeSessionId} already processed (status: ${existingPayment.status}). Skipping fulfillment.`);
                    // Acknowledge to Stripe that we've received and handled this event
                    return res.status(200).json({ received: true, message: "Payment already processed" });
                }

                // --- 1. Create/Update ClientContractor relationship ---
                if (purchasedEmployeeId && userId) {
                    try {
                        // Use upsert to either create a new record or update an existing one.
                        // This handles cases where a client might try to "re-purchase" access
                        // to the same contractor, or ensures a fresh record if it's the first time.
                        const clientContractorRecord = await prisma.clientContractor.upsert({
                            where: {
                                clientId_contractorId: { // This targets the @@unique constraint
                                    clientId: userId,
                                    contractorId: purchasedEmployeeId,
                                }
                            },
                            update: {
                                active: true, // Ensure it's active if they paid again
                                endedAt: null, // If it was previously ended, reactivate
                                paymentIntentId: stripePaymentIntentId, // Update with latest payment info
                                paymentAmount: totalAmount / 100, // Store in dollars/currency unit
                                paymentStatus: paymentStatus, // Should be 'paid'
                                hiredAt: new Date(), // Update the hired timestamp if it's a "re-hire"
                            },
                            create: {
                                clientId: userId,
                                contractorId: purchasedEmployeeId,
                                paymentIntentId: stripePaymentIntentId,
                                paymentAmount: totalAmount / 100,
                                paymentStatus: paymentStatus,
                                active: true,
                            },
                        });
                        console.log(`Client ${userId} successfully ${clientContractorRecord.id ? 'updated' : 'hired'} contractor ${purchasedEmployeeId}.`);
                    } catch (dbError) {
                        console.error(`Error upserting ClientContractor record for client ${userId} and contractor ${purchasedEmployeeId}:`, dbError);
                        // Log and alert: this is a critical business logic failure
                        // Do NOT re-throw, allow the webhook handler to return 200 to Stripe
                    }
                } else {
                    console.warn(`Missing employeeId (${purchasedEmployeeId}) or userId (${userId}) in metadata for ClientContractor fulfillment.`);
                }

                // --- 2. Add VPC credits to the user (Client) ---
                if (purchasedVpcCount > 0) {
                    try {
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                // Make sure your User model has a `vpcCredits` field (Int)
                                vpcCredits: {
                                    increment: purchasedVpcCount,
                                },
                            },
                        });
                        console.log(`User ${userId} received ${purchasedVpcCount} VPC credits.`);
                    } catch (dbError) {
                        console.error(`Error updating VPC credits for user ${userId}:`, dbError);
                        // Log and alert
                    }
                }

                // --- 3. Record the payment in your database (for auditing) ---
                try {
                    await prisma.payment.create({
                        data: {
                            userId: userId,
                            stripeSessionId: stripeSessionId,
                            stripePaymentIntentId: stripePaymentIntentId, // Store this too
                            amount: totalAmount, // Keep in cents as per your schema
                            currency: currency,
                            status: paymentStatus, // 'paid'
                            description: `Purchase of employee profile (${purchasedEmployeeId}) and ${purchasedVpcCount} VPCs`,
                            // If your Payment model has a Json? metadata field:
                            // metadata: session.metadata,
                        }
                    });
                    console.log(`Payment record created for session ${stripeSessionId}.`);
                } catch (dbError) {
                    console.error(`Error creating Payment record for session ${stripeSessionId}:`, dbError);
                    // Log and alert
                }

                console.log(`Full fulfillment process completed for session ${stripeSessionId}.`);

            } catch (error) {
                // Catch-all for unexpected errors during fulfillment (not for bad webhook signature)
                console.error("Critical error during checkout.session.completed fulfillment:", error);
                // Even on critical fulfillment errors, we return 200 to Stripe.
                // The error logging and alerting should handle notifying you.
            }
            break;

        // ... (other event types like payment_intent.succeeded, payment_intent.payment_failed, etc.) ...
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Always return a 200 response to acknowledge receipt of the event to Stripe.
    res.status(200).json({ received: true });
});

export {
    createCheckoutSession,
    stripeWebhookHandler,
    mockFulfillPayment
};
