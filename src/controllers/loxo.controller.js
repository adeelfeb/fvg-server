// // src/controllers/loxo.controller.js
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { ApiError } from "../utils/ApiError.js";
// import { fetchJobs, applyToJob } from "../services/loxoService.js";

// export const getJobs = asyncHandler(async (req, res) => {
//   const jobs = await fetchJobs();
//   return res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
// });

// export const applyToLoxoJob = asyncHandler(async (req, res) => {
//   const { jobId, candidate } = req.body;

//   if (!jobId || !candidate) {
//     throw new ApiError(400, "Missing jobId or candidate information");
//   }

//   const response = await applyToJob(jobId, candidate);
//   return res.status(200).json(new ApiResponse(200, response, "Candidate applied successfully"));
// });



// src/controllers/loxo.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchJobs, applyToJob, fetchCandidatesByJob } from "../services/loxoService.js";

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

export const getSelectedCandidates = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new ApiError(400, "Missing jobId");
  }

  const { candidates } = await fetchCandidatesByJob(jobId); // ✅ FIXED

  if (!candidates || candidates.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No candidates found for this job"));
  }

  console.log("Fetched candidates:", candidates);

  const selected = candidates.filter(
    (c) => c.workflow_stage_id === jobId // Replace with the actual ID for "Selected" stage
  );


  return res.status(200).json(new ApiResponse(200, selected, "Selected candidates fetched"));
});


export const getHiredCandidates = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new ApiError(400, "Missing jobId");
  }

  const candidates = await fetchCandidatesByJob(jobId);
  const hired = candidates.filter(c => c.workflow_stage?.name?.toLowerCase() === "hired");

  return res.status(200).json(new ApiResponse(200, hired, "Hired candidates fetched"));
});
