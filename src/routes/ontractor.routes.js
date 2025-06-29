import { Router } from 'express';
import { getAllContractors, getContractorProfile, updateMyProfile } from '../controllers/contractor.controller.js';
// import { verifyJWT } from '../middlewares/auth.middleware.js'; // Middleware to check if user is logged in

const router = Router();

// PUBLIC ROUTES - Anyone can see contractors
router.route("/").get(getAllContractors);
router.route("/:id").get(getContractorProfile);


// SECURED ROUTE - A logged-in contractor can update their own profile
// The logic to get the user ID should come from the decoded JWT token (req.user)
// router.route("/profile/me").put(verifyJWT, updateMyProfile);

export default router;