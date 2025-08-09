// src/routes/loxo.routes.js
import { Router } from "express";
import {
  getJobs,
  applyToLoxoJob,
  getSelectedCandidates,
  getPreQualifiedCandidates,
  getStagingIds,
  getJobById,
  getAllCandidatesInEveryStage
} from "../controllers/loxo.controller.js";

const router = Router();

router.get("/jobs", getJobs);
router.get("/jobs/:jobId", getJobById);
router.post("/apply", applyToLoxoJob);

router.get("/jobs/:jobId/selected-candidates", getSelectedCandidates);


router.get('/candidates/pre-qualified', getPreQualifiedCandidates);


router.get('/stages-Id', getStagingIds);
router.get('/all-candidates-all', getAllCandidatesInEveryStage);


export default router;
