import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Your Prisma client
import Stripe from 'stripe';
import { UserRole } from '@prisma/client'; // Import UserRole if you need it for employee type checking

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
        // Construct the event from the raw body and signature
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        throw new ApiError(400, `Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout Session Completed:', session);

            // Retrieve relevant information from the session
            const userId = session.client_reference_id; // Your internal user ID
            const paymentStatus = session.payment_status; // 'paid'
            const totalAmount = session.amount_total; // Total amount in cents
            const currency = session.currency;
            const stripeSessionId = session.id;

            // IMPORTANT: Fulfill the purchase here
            // This is where you update your database, grant access to content, send confirmation emails, etc.
            // Example: Update an order status in your database
            try {
                // Assuming you have an 'Order' model in Prisma or want to update a user's status
                // For demonstration, let's imagine an 'Order' model
                // You might need to fetch the order based on metadata or create a new one
                // For simplicity, let's just log and acknowledge. In a real app, you'd do DB ops.

                // Example: Find or create an order record
                // This is a placeholder. Your actual logic will depend on your order management.
                // You might have passed an orderId in metadata when creating the session.
                // For now, let's just create a dummy "payment record" or update a user's status
                await prisma.payment.create({ // Assuming you have a Payment model in Prisma
                    data: {
                        userId: userId,
                        stripeSessionId: stripeSessionId,
                        amount: totalAmount,
                        currency: currency,
                        status: paymentStatus, // 'paid'
                        // Add other relevant fields like product details, etc.
                    }
                });

                console.log(`Payment successful for user ${userId}. Amount: ${totalAmount / 100} ${currency.toUpperCase()}`);

            } catch (dbError) {
                console.error("Error updating database after successful checkout:", dbError);
                // You might want to log this error and potentially trigger a manual review
                // Or use a retry mechanism for idempotency
            }
            break;

        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!', paymentIntent);
            // Handle successful payment intent (e.g., for direct charges)
            break;

        case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object;
            console.log('PaymentIntent failed!', failedPaymentIntent.last_payment_error);
            // Handle failed payment intent (e.g., update order status to failed)
            break;

        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
});

export {
    createCheckoutSession,
    stripeWebhookHandler
};
