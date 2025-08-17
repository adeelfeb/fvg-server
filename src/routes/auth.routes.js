import { Router } from 'express';
import { registerUser, loginUser, registerEmployee, registerMultipleEmployees, verifyUser } from '../controllers/auth.controller.js';
import {  fastVerifyJWT } from '../middlewares/auth.middleware.js'; 

const router = Router();

// PUBLIC ROUTES
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify").post(fastVerifyJWT, verifyUser);
router.route("/employee").post(registerEmployee);
router.route("/Multi-register").post(registerMultipleEmployees);

// SECURED ROUTES (Example)
// router.route("/logout").post(verifyJWT, logoutUser);

export default router;