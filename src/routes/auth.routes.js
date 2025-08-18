import { Router } from 'express';
import { registerUser, loginUser, registerEmployee, registerMultipleEmployees, verifyUser, verifyEmail, registerUserNo, sendVerificationCode, googleAuth, googleAuthCallback } from '../controllers/auth.controller.js';
import {  fastVerifyJWT } from '../middlewares/auth.middleware.js'; 
import passport from "../passport.js";

const router = Router();

// PUBLIC ROUTES
// router.route("/register").post(registerUser);
router.route("/register").post(registerUserNo);
router.route("/temp-reg").post(registerUserNo);
router.route("/login").post(loginUser);
router.route("/verify").post(fastVerifyJWT, verifyUser);
router.route("/employee").post(registerEmployee);
router.route("/Multi-register").post(registerMultipleEmployees);


router.post("/send-verification", sendVerificationCode);
router.post("/verify-email", verifyEmail);

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;