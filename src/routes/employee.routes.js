import { Router } from 'express';
// Assuming your controller functions are exported from these files
import { getVerifiedContractors, getVerifiedContractorsLogin, getEmployeeById } from '../controllers/employee.controller.js';
// If you have authentication middleware, import it here
import { getAllContractors } from '../controllers/contractor.controller.js';

const router = Router();

// Route to get all verified contractor profiles
router.route("/single-employee").post(getEmployeeById);
router.route("/verified").post(getVerifiedContractors);
router.route("/login").post(getVerifiedContractorsLogin);
router.route("/get").get(getAllContractors);

// Example of a protected route (if you decide to make it protected later)
// router.route("/verified").get(verifyJWT, getVerifiedContractors);

export default router;