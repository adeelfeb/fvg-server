import { Router } from 'express';
// Assuming your controller functions are exported from these files
import { getVerifiedContractors, getVerifiedContractorsLogin, getEmployeeById, getContractorsByCategory } from '../controllers/employee.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Adjust path as needed

const router = Router();

// Public routes (no authentication needed)
router.route("/single-employee").post(verifyJWT, getEmployeeById);
router.route("/category/login").post(verifyJWT, getContractorsByCategory);
router.route("/category/free").post( getContractorsByCategory);
router.route("/verified").post(getVerifiedContractors);
router.route("/login").post(verifyJWT, getVerifiedContractorsLogin);

// Example of a protected route:
// To protect a route, simply add `verifyJWT` before your controller function.
// The request will only reach `getVerifiedContractors` if the token is valid.
router.route("/protected-verified-contractors").post(verifyJWT, getVerifiedContractors);

// Another example of a protected route
router.route("/protected-employee-by-id").post(verifyJWT, getEmployeeById);


export default router;
