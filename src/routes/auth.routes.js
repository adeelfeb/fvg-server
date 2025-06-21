import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js'; // If you're protecting /current-user

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser); // Protect logout
router.route("/current-user").get(verifyJWT, getCurrentUser); // Protect current-user

export default router;