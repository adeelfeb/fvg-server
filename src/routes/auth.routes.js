import { Router } from 'express';
import { registerUser, loginUser, registerEmployee } from '../controllers/auth.controller.js';

const router = Router();

// PUBLIC ROUTES
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/employee").post(registerEmployee);

// SECURED ROUTES (Example)
// router.route("/logout").post(verifyJWT, logoutUser);

export default router;