// src/routes/loxo.routes.js
import { Router } from "express";
import {
  getJobs,
  applyToLoxoJob,
  getSelectedCandidates,
  getHiredCandidates
} from "../controllers/loxo.controller.js";

const router = Router();

router.get("/jobs", getJobs);
router.post("/apply", applyToLoxoJob);

router.get("/jobs/:jobId/selected-candidates", getSelectedCandidates);
router.get("/jobs/:jobId/hired-candidates", getHiredCandidates);

export default router;
