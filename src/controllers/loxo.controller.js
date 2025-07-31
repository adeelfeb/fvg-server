// src/controllers/loxo.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchJobs, applyToJob } from "../services/loxoService.js";

export const getJobs = asyncHandler(async (req, res) => {
  const jobs = await fetchJobs();
  return res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
});

export const applyToLoxoJob = asyncHandler(async (req, res) => {
  const { jobId, candidate } = req.body;

  if (!jobId || !candidate) {
    throw new ApiError(400, "Missing jobId or candidate information");
  }

  const response = await applyToJob(jobId, candidate);
  return res.status(200).json(new ApiResponse(200, response, "Candidate applied successfully"));
});
