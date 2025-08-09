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


///////////////////////////

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

    console.log(`✅ Total number of Pre Qualified candidates fetched: ${filteredCandidates.length}`);

    const newlyAddedCandidates = [];

    for (const candidate of filteredCandidates) {
        try {
            // Check if a LoxoJob record already exists for this specific candidate and job.
            const existingLoxoJob = await prisma.loxoJob.findUnique({
                where: {
                    loxoCandidateId: candidate.id, // Using the unique loxoCandidateId
                },
            });

            if (existingLoxoJob) {
                console.log(`✅ LoxoJob for loxoCandidateId: ${candidate.id} and jobId: ${candidate.jobId} already exists. Skipping.`);
                continue;
            }

            let userId;

            // Check if a User already exists with this Loxo Person ID.
            const existingUser = await prisma.user.findUnique({
                where: {
                    loxoId: candidate.person.id,
                },
            });

            if (existingUser) {
                userId = existingUser.id;
                console.log(`ℹ️ User with Loxo Person ID: ${candidate.person.id} exists. Linking new job.`);
            } else {
                const nameParts = candidate.person.name.trim().split(/\s+/);
                const firstName = nameParts[0] || null;
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

                // User does not exist, so we create a new User and a nested Profile.
                const createdUser = await prisma.user.create({
                    data: {
                        loxoId: candidate.person.id,
                        firstName: firstName,
                        lastName: lastName,
                        fullName: candidate.person.name || null,
                        email: candidate.person.emails.length > 0 ? candidate.person.emails[0].value : null,
                        profile: {
                            create: {
                                country: candidate.person.country || null,
                                profilePhotoUrl: candidate.person.profile_picture_original_url || null,
                                roleType: candidate.person.current_title ? [candidate.person.current_title] : [],
                                rateRange: candidate.person.compensation ? String(candidate.person.compensation) : null,
                                // Add other mappings here as needed
                            },
                        },
                    },
                });
                userId = createdUser.id;
                console.log(`🆕 Created new user with Loxo Person ID: ${candidate.person.id}.`);
            }

            // Create the LoxoJob record and link it to the existing or new User.
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
            console.log(`🆕 Successfully added new LoxoJob for loxoCandidateId: ${candidate.id} and jobId: ${candidate.jobId}`);
        } catch (error) {
            console.error(`❌ Error processing candidate with loxoId: ${candidate.person.id} and jobId: ${candidate.jobId}`, error);
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                allFiltered: filteredCandidates,
                newlyAdded: newlyAddedCandidates,
            },
            `Stored ${newlyAddedCandidates.length} new candidates and found ${filteredCandidates.length} Pre Qualified candidates`
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

//   const newlyAddedEmployees = [];

//   for (const candidate of filteredCandidates) {
//     // Check for a unique entry using a combination of Loxo candidate ID and job ID
//     const existingEmployee = await prisma.employee.findFirst({
//       where: {
//         loxoCandidateId: candidate.id,
//         jobId: candidate.jobId,
//       },
//     });

//     if (existingEmployee) {
//       console.log(`✅ Employee with loxoCandidateId: ${candidate.id} and jobId: ${candidate.jobId} already exists. Skipping.`);
//       continue;
//     }

//     try {
//       const createdEmployee = await prisma.employee.create({
//         data: {
//           loxoCandidateId: candidate.id,
//           position: candidate.position,
//           jobId: candidate.jobId,
//           jobTitle: candidate.jobTitle,
//           jobPublishedName: candidate.jobPublishedName,
//           workflow_stage_id: candidate.workflow_stage_id,
//           candidate_rejection_reason: candidate.candidate_rejection_reason,
          
//           person: {
//             create: {
//               loxoId: candidate.person.id, // 🆕 Store Loxo's person ID
//               name: candidate.person.name,
//               profile_picture_thumb_url: candidate.person.profile_picture_thumb_url,
//               profile_picture_original_url: candidate.person.profile_picture_original_url,
//               location: candidate.person.location,
//               address: candidate.person.address,
//               city: candidate.person.city,
//               state: candidate.person.state,
//               zip: candidate.person.zip,
//               country: candidate.person.country,
//               current_title: candidate.person.current_title,
//               current_company: candidate.person.current_company,
//               current_compensation: candidate.person.current_compensation,
//               compensation: candidate.person.compensation,
//               compensation_notes: candidate.person.compensation_notes,
//               compensation_currency_id: candidate.person.compensation_currency_id,
//               salary: candidate.person.salary,
//               salary_type_id: candidate.person.salary_type_id,
//               owned_by_id: candidate.person.owned_by_id,
//               created_at: new Date(candidate.person.created_at),
//               created_by_id: candidate.person.created_by_id,
//               updated_by_id: candidate.person.updated_by_id,
//               updated_at: new Date(candidate.person.updated_at),
//               linkedin_url: candidate.person.linkedin_url,
              
//               person_types: {
//                 create: (candidate.person.person_types || []).map((type) => ({
//                   loxoId: type.id, // 🆕 Use the new loxoId field
//                   name: type.name,
//                 })),
//               },

//               emails: {
//                 create: (candidate.person.emails || []).map((email) => ({
//                   loxoId: email.id, // 🆕 Use the new loxoId field
//                   value: email.value,
//                   email_type_id: email.email_type_id,
//                 })),
//               },

//               phones: {
//                 create: (candidate.person.phones || []).map((phone) => ({
//                   loxoId: phone.id, // 🆕 Use the new loxoId field
//                   value: phone.value,
//                   phone_type_id: phone.phone_type_id,
//                 })),
//               },
//             },
//           },
          
//           latest_person_event: candidate.latest_person_event
//             ? {
//                 create: {
//                   loxoId: candidate.latest_person_event.id, // 🆕 Use the new loxoId field
//                   activity_type_id: candidate.latest_person_event.activity_type_id,
//                   created_at: new Date(candidate.latest_person_event.created_at),
//                   created_by_id: candidate.latest_person_event.created_by_id,
//                   updated_at: new Date(candidate.latest_person_event.updated_at),
//                   updated_by_id: candidate.latest_person_event.updated_by_id,
//                 },
//               }
//             : undefined,
//         },
//       });

//       newlyAddedEmployees.push(createdEmployee);
//       console.log(`🆕 Successfully added new employee for loxoCandidateId: ${candidate.id}`);
//     } catch (error) {
//       console.error(`❌ Error saving candidate with loxoCandidateId: ${candidate.id}`, error);
//     }
//   }

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         allFiltered: filteredCandidates,
//         newlyAdded: newlyAddedEmployees,
//       },
//       `Stored ${newlyAddedEmployees.length} new employees and found ${filteredCandidates.length} Pre Qualified candidates`
//     )
//   );
// });

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