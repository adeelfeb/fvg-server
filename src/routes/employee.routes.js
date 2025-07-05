import { Router } from 'express';
// Assuming your controller functions are exported from these files
import { getVerifiedContractors, getVerifiedContractorsLogin } from '../controllers/employee.controller.js';
// If you have authentication middleware, import it here
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Route to get all verified contractor profiles
router.route("/verified").get(getVerifiedContractors);
router.route("/login").get(getVerifiedContractorsLogin);

// Example of a protected route (if you decide to make it protected later)
// router.route("/verified").get(verifyJWT, getVerifiedContractors);

export default router;