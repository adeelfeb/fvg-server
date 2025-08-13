// src/controllers/loxo.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchJobs, applyToJob, fetchCandidatesByJob, fetchAllCandidatesFromAllJobs, fetchAllWorkflowStages, fetchJobById } from "../services/loxoService.js";
import prisma, { UserRole } from '../db/index.js';


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




export const getAllCandidatesInAJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  
  if (!jobId) {
    throw new ApiError(400, "Missing jobId");
  }
  
  const response = await fetchCandidatesByJob(jobId);
  

  return res.status(200).json(new ApiResponse(200, response, `All candidates fetched ${response.length} for job ${jobId}`));
});

/////////////////////////////



export const filterCandidatesByStage = (allCandidates, allStages, stageName) => {
    // Find the specific stage object by its name.
    const targetStage = allStages.find(stage => stage.name === stageName);

    // If the stage is not found, throw an error to prevent further processing.
    if (!targetStage) {
        throw new ApiError(500, `${stageName} stage not found in workflow stages`);
    }

    // Filter the candidates based on the workflow stage ID.
    // The filter checks if the candidate's stage ID matches the target stage's ID.
    const filteredCandidates = allCandidates.filter(candidate => {
        const meetsCondition = candidate.workflow_stage_id === targetStage.id;
        return meetsCondition;
    });

    return filteredCandidates;
};


///////////////////////////


export const getPreQualifiedCandidates = asyncHandler(async (req, res) => {
    const allCandidates = await fetchAllCandidatesFromAllJobs();
    const stages = await fetchAllWorkflowStages();

    const preQualifiedCandidates = filterCandidatesByStage(allCandidates, stages, "Pre Qualified");
    const newlyAddedCandidates = [];

    for (const candidate of preQualifiedCandidates) {
        try {
            // Check if a LoxoJob record already exists for this specific candidate and job.
            const existingLoxoJob = await prisma.loxoJob.findFirst({
                where: {
                    loxoCandidateId: candidate.id,
                    jobId: candidate.jobId
                },
                include: { user: { include: { profile: true } } }
            });

            if (existingLoxoJob) {
                // Update the existing user's profile with the new data
                await prisma.user.update({
                  where: { id: existingLoxoJob.userId },
                  data: {
                    firstName: candidate.person.name?.split(/\s+/)[0] || existingLoxoJob.user.firstName,
                    lastName: candidate.person.name?.split(/\s+/).slice(1).join(' ') || existingLoxoJob.user.lastName,
                    email: candidate.person.emails?.[0]?.value || `noemail-${candidate.person.id}@placeholder.loxo`,
                    role: UserRole.CONTRACTOR,
                    profile: {
                      update: {
                        country: candidate.person.country || existingLoxoJob.user.profile.country,
                        profilePhotoUrl: candidate.person.profile_picture_original_url || existingLoxoJob.user.profile.profilePhotoUrl,
                        roleType: candidate.person.current_title ? [candidate.person.current_title] : existingLoxoJob.user.profile.roleType,
                        rateRange: candidate.person.compensation ? String(candidate.person.compensation) : existingLoxoJob.user.profile.rateRange,

                        // NEW fields
                        loxoCreatedAt: candidate.person.created_at ? new Date(candidate.person.created_at) : existingLoxoJob.user.profile.loxoCreatedAt,
                        loxoUpdatedAt: candidate.person.updated_at ? new Date(candidate.person.updated_at) : existingLoxoJob.user.profile.loxoUpdatedAt,
                        isBlocked: candidate.person.blocked ?? existingLoxoJob.user.profile.isBlocked,
                        sourceType: candidate.person.source_type?.name || existingLoxoJob.user.profile.sourceType,
                        salary: candidate.person.salary ?? existingLoxoJob.user.profile.salary,
                        salaryTypeId: candidate.person.salary_type_id ?? existingLoxoJob.user.profile.salaryTypeId,
                        compensation: candidate.person.compensation ?? existingLoxoJob.user.profile.compensation,
                        workflowStageId: candidate.workflow_stage_id ?? existingLoxoJob.user.profile.workflowStageId,
                      }
                    }
                  }
                });

                continue;
            }

            let userId;
            const existingUser = await prisma.user.findUnique({
                where: { loxoId: candidate.person.id },
            });

            if (existingUser) {
                userId = existingUser.id;
            } else {
                const nameParts = candidate.person.name?.trim().split(/\s+/) || [];
                const firstName = nameParts[0] || null;
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

                const createdUser = await prisma.user.create({
                  data: {
                    loxoId: candidate.person.id,
                    firstName,
                    lastName,
                    fullName: candidate.person.name || null,
                    email: candidate.person.emails?.[0]?.value || `noemail-${candidate.person.id}@placeholder.loxo`,
                    role: UserRole.CONTRACTOR,
                    profile: {
                      create: {
                        country: candidate.person.country || null,
                        profilePhotoUrl: candidate.person.profile_picture_original_url || null,
                        roleType: candidate.person.current_title ? [candidate.person.current_title] : [],
                        rateRange: candidate.person.compensation ? String(candidate.person.compensation) : null,

                        // NEW fields
                        loxoCreatedAt: candidate.person.created_at ? new Date(candidate.person.created_at) : null,
                        loxoUpdatedAt: candidate.person.updated_at ? new Date(candidate.person.updated_at) : null,
                        isBlocked: candidate.person.blocked ?? null,
                        sourceType: candidate.person.source_type?.name || null,
                        salary: candidate.person.salary ?? null,
                        salaryTypeId: candidate.person.salary_type_id ?? null,
                        compensation: candidate.person.compensation ?? null,
                        workflowStageId: candidate.workflow_stage_id ?? null,
                      }
                    }
                  },
                });

                userId = createdUser.id;
            }

            const existingJob = await prisma.loxoJob.findFirst({
              where: {
                jobId: candidate.jobId,
                loxoCandidateId: candidate.id,
                userId: userId
              }
            });

            if (!existingJob) {
              const createdLoxoJob = await prisma.loxoJob.create({
                data: {
                  loxoCandidateId: candidate.id,
                  jobId: candidate.jobId,
                  jobTitle: candidate.jobTitle,
                  jobPublishedName: candidate.jobPublishedName,
                  userId: userId,
                },
              });

              newlyAddedCandidates.push(createdLoxoJob);
            }
        } catch (error) {
            console.error(`❌ Error processing candidate with loxoId: ${candidate.person.id} and jobId: ${candidate.jobId}`, error);
        }
    }

    console.log("Done with it :", newlyAddedCandidates.length)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                allFiltered: preQualifiedCandidates,
                newlyAdded: newlyAddedCandidates,
            },
            `Stored ${newlyAddedCandidates.length} new candidates and found ${preQualifiedCandidates.length} Pre Qualified candidates`
        )
    );
});

export const getStagingIds = asyncHandler(async (req, res) => {
  const stages = await fetchAllWorkflowStages();


  return res.status(200).json(
    new ApiResponse(200, stages, `Here are all workflow stages with their IDs`)
  );
});


export const getAllCandidatesInEveryStage = asyncHandler(async (req, res) => {
  const allCandidates = await fetchAllCandidatesFromAllJobs();


  return res.status(200).json(
    new ApiResponse(200, allCandidates, `Here are all ${allCandidates.length} candidates in every stage`)
  );
});