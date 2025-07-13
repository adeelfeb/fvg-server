import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js'; // Your Prisma client
import Stripe from 'stripe';

// Initialize Stripe with your secret key
// Ensure process.env.STRIPE_SECRET_KEY is loaded (e.g., using dotenv)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Use a recent API version
});

/**
 * @description Creates a Stripe Checkout Session for one-time payments.
 * @route POST /api/v1/stripe/create-checkout-session
 * @access Protected (or Public, depending on your app's flow)
 * @param {Array<Object>} req.body.items - An array of items to purchase, e.g., [{ name: "Product A", price: 1000, quantity: 1 }]
 * price should be in cents (e.g., $10.00 is 1000)
 * @param {string} req.user.id - The ID of the authenticated user (from verifyJWT middleware)
 */
const createCheckoutSession = asyncHandler(async (req, res) => {
    const { items } = req.body;
    const userId = req.user?.id; // Assuming req.user is populated by verifyJWT

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "Items array is required and cannot be empty.");
    }

    if (!userId) {
        // This check is important if you make this route protected by verifyJWT
        throw new ApiError(401, "User not authenticated for checkout session creation.");
    }

    try {
        // Transform items into Stripe's line_items format
        const lineItems = items.map(item => {
            // Ensure price is in cents and quantity is valid
            const unitAmount = Math.round(parseFloat(item.price) * 100); // Convert to cents
            if (isNaN(unitAmount) || unitAmount <= 0) {
                throw new ApiError(400, `Invalid price for item: ${item.name}`);
            }
            if (isNaN(item.quantity) || item.quantity <= 0) {
                throw new ApiError(400, `Invalid quantity for item: ${item.name}`);
            }

            return {
                price_data: {
                    currency: 'usd', // Or your desired currency
                    product_data: {
                        name: item.name,
                        description: item.description,
                        images: item.images || [], // Optional: array of image URLs for the product
                    },
                    unit_amount: unitAmount, // Price in cents
                },
                quantity: item.quantity,
            };
        });

        // Create a new checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Or other payment methods like 'paypal'
            line_items: lineItems,
            mode: 'payment', // For one-time payments. Use 'subscription' for recurring.
            success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: process.env.STRIPE_CANCEL_URL,
            customer_email: req.user.email, // Pre-fill customer email if available from authenticated user
            client_reference_id: userId, // Store your internal user ID with the session
            metadata: {
                userId: userId, // Custom metadata you can retrieve later
                // You can add other relevant order IDs or details here
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
            throw new ApiError(500, "Failed to create checkout session.", error.message);
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
