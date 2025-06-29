import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';

const router = Router();

// PUBLIC ROUTES
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// SECURED ROUTES (Example)
// router.route("/logout").post(verifyJWT, logoutUser);

export default router;