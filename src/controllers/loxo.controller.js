// src/controllers/loxo.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchJobs, applyToJob, fetchCandidatesByJob, fetchAllCandidatesFromAllJobs, fetchAllWorkflowStages, fetchJobById } from "../services/loxoService.js";

export const getJobs = asyncHandler(async (req, res) => {
  const jobs = await fetchJobs();
  return res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched successfully"));
});


export const getJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new ApiError(400, "Missing jobId");
  }

  const job = await fetchJobById(jobId);

  if (!job) {
    return res.status(404).json(new ApiResponse(404, null, "Job not found"));
  }

  return res.status(200).json(new ApiResponse(200, job, "Job fetched successfully"));
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

  const response = await fetchCandidatesByJob(jobId);
  const candidates = Array.isArray(response?.candidates)
    ? response.candidates
    : response?.candidates?.results || [];

  // console.log("Fetched candidates for job:", jobId, candidates.length);
  // candidates.forEach(c => {
  //   console.log(`Candidate ID: ${c.id}, Name: ${c.name}, Stage ID: ${c.workflow_stage_id}`);
  // });

  if (!candidates || candidates.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No candidates found for this job"));
  }

  const selected = candidates.filter(
    (c) => String(c.workflow_stage_id) === "318339"
  );

  return res.status(200).json(new ApiResponse(200, selected, `Selected candidates fetched ${selected.length} for job ${jobId}`));
});


/////////////////////////////////////////




export const getPreQualifiedCandidates = asyncHandler(async (req, res) => {
  const allCandidates = await fetchAllCandidatesFromAllJobs();
  const stages = await fetchAllWorkflowStages();

  const preQualifiedStage = stages.find(stage => stage.name === "Pre Qualified");

  if (!preQualifiedStage) {
    throw new ApiError(500, "Pre Qualified stage not found in workflow stages");
  }

  const filteredCandidates = allCandidates.filter(
    candidate => candidate.workflow_stage_id === preQualifiedStage.id
  );

  return res.status(200).json(
    new ApiResponse(200, filteredCandidates, `Found ${filteredCandidates.length} Pre Qualified candidates`)
  );
});

///////////////////////////////////////


export const getStagingIds = asyncHandler(async (req, res) => {
 
  const stages = await fetchAllWorkflowStages();


  return res.status(200).json(
    new ApiResponse(200, stages, `Here are all workflow stages with their IDs`)
  );
});