import { Router } from 'express';
// import { mockFulfillPayment } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Your existing JWT middleware
import {processAuthorizePayment} from "../controllers/authorizeNet.controller.js"

const router = Router();

// Route to create a Stripe Checkout Session
// This route should typically be protected, as only logged-in users should initiate payments.
// router.route("/create-checkout-session").post(verifyJWT, createCheckoutSession);
router.route("/charge-authorize-net").post(verifyJWT, processAuthorizePayment);

export default router;
