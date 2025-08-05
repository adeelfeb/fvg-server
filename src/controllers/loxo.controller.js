// src/controllers/loxo.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchJobs, applyToJob, fetchCandidatesByJob, fetchAllCandidatesFromAllJobs, fetchAllWorkflowStages, fetchJobById } from "../services/loxoService.js";
import prisma from '../db/index.js';     

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

  const newlyAddedEmployees = []; // ✅ Store newly added employees

  for (const candidate of filteredCandidates) {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        loxoCandidateId: candidate.id,
        jobId: candidate.jobId,
      },
    });

    if (existingEmployee) continue;

    const createdEmployee = await prisma.employee.create({
      data: {
        loxoCandidateId: candidate.id,
        position: candidate.position,
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        jobPublishedName: candidate.jobPublishedName,
        workflow_stage_id: candidate.workflow_stage_id,
        candidate_rejection_reason: candidate.candidate_rejection_reason,

        person: {
          create: {
            loxoCandidateId: candidate.id, 
            name: candidate.person.name,
            profile_picture_thumb_url: candidate.person.profile_picture_thumb_url,
            profile_picture_original_url: candidate.person.profile_picture_original_url,
            location: candidate.person.location,
            address: candidate.person.address,
            city: candidate.person.city,
            state: candidate.person.state,
            zip: candidate.person.zip,
            country: candidate.person.country,
            current_title: candidate.person.current_title,
            current_company: candidate.person.current_company,
            current_compensation: candidate.person.current_compensation,
            compensation: candidate.person.compensation,
            compensation_notes: candidate.person.compensation_notes,
            compensation_currency_id: candidate.person.compensation_currency_id,
            salary: candidate.person.salary,
            salary_type_id: candidate.person.salary_type_id,
            owned_by_id: candidate.person.owned_by_id,
            created_at: new Date(candidate.person.created_at),
            created_by_id: candidate.person.created_by_id,
            updated_by_id: candidate.person.updated_by_id,
            updated_at: new Date(candidate.person.updated_at),
            linkedin_url: candidate.person.linkedin_url,

            person_types: {
              create: (candidate.person.person_types || []).map((type) => ({
                id: type.id,
                name: type.name,
              })),
            },

            emails: {
              create: (candidate.person.emails || []).map((email) => ({
                id: email.id,
                value: email.value,
                email_type_id: email.email_type_id,
              })),
            },

            phones: {
              create: (candidate.person.phones || []).map((phone) => ({
                id: phone.id,
                value: phone.value,
                phone_type_id: phone.phone_type_id,
              })),
            },
          },
        },

        latest_person_event: candidate.latest_person_event
          ? {
              create: {
                id: candidate.latest_person_event.id,
                activity_type_id: candidate.latest_person_event.activity_type_id,
                created_at: new Date(candidate.latest_person_event.created_at),
                created_by_id: candidate.latest_person_event.created_by_id,
                updated_at: new Date(candidate.latest_person_event.updated_at),
                updated_by_id: candidate.latest_person_event.updated_by_id,
              },
            }
          : undefined,
      },
    });

    // ✅ Push to newly added array
    newlyAddedEmployees.push(createdEmployee);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allFiltered: filteredCandidates,
        newlyAdded: newlyAddedEmployees,
      },
      `Stored ${newlyAddedEmployees.length} new employees and found ${filteredCandidates.length} Pre Qualified candidates`
    )
  );
});



// export const getPreQualifiedCandidates = asyncHandler(async (req, res) => {
//   const allCandidates = await fetchAllCandidatesFromAllJobs();
//   const stages = await fetchAllWorkflowStages();

//   const preQualifiedStage = stages.find(stage => stage.name === "Pre Qualified");

//   if (!preQualifiedStage) {
//     throw new ApiError(500, "Pre Qualified stage not found in workflow stages");
//   }

//   const filteredCandidates = allCandidates.filter(
//     candidate => candidate.workflow_stage_id === preQualifiedStage.id
//   );

//   return res.status(200).json(
//     new ApiResponse(200, filteredCandidates, `Found ${filteredCandidates.length} Pre Qualified candidates`)
//   );
// });

///////////////////////////////////////


export const getStagingIds = asyncHandler(async (req, res) => {
  const stages = await fetchAllWorkflowStages();


  return res.status(200).json(
    new ApiResponse(200, stages, `Here are all workflow stages with their IDs`)
  );
});