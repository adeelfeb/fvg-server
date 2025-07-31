// src/routes/loxo.routes.js
import { Router } from "express";
import { getJobs, applyToLoxoJob } from "../controllers/loxo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Optional protection

const router = Router();

// Public or protected based on your design
router.get("/jobs", getJobs); // You can add `verifyJWT` here if needed
router.post("/apply", applyToLoxoJob);

export default router;
