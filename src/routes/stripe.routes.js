import { Router } from 'express';
import { createCheckoutSession, stripeWebhookHandler } from '../controllers/stripe.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Your existing JWT middleware

const router = Router();

// Route to create a Stripe Checkout Session
// This route should typically be protected, as only logged-in users should initiate payments.
router.route("/create-checkout-session").post(verifyJWT, createCheckoutSession);

// Route for Stripe webhooks
// This route MUST NOT have any body parsing middleware applied (like express.json())
// It needs the raw body for signature verification.
router.route("/webhook").post(stripeWebhookHandler);

export default router;
