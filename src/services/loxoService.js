// src/services/loxoService.js
import loxoClient from './loxoClient.js';

/**
 * Fetch all jobs from the Loxo API
 */
export async function fetchJobs() {
  try {
    const response = await loxoClient.get('/jobs');
    return { jobs: response.data }; // manually wrapping
  } catch (error) {
    console.error('❌ Error fetching jobs:', error.message || error);
    throw new Error('Failed to fetch jobs from Loxo');
  }
}


export async function fetchJobById(jobId) {
  try {
    const { data } = await loxoClient.get(`/jobs/${jobId}`);
    return data; // assuming Loxo returns a job object
  } catch (error) {
    console.error(`❌ Error fetching job with ID ${jobId}:`, error.message || error);
    throw new Error('Failed to fetch job by ID');
  }
}


/**
 * Apply a candidate to a job
 */
export async function applyToJob(jobId, candidateData) {
  try {
    const { data } = await loxoClient.post(`/jobs/${jobId}/apply`, {
      person: candidateData
    });
    return data;
  } catch (error) {
    console.error(`❌ Error applying to job ${jobId}:`, error.message || error);
    throw new Error(`Failed to apply to job with ID ${jobId}`);
  }
}

/**
 * Fetch candidates for a specific job
 */
export async function fetchCandidatesByJob(jobId) {
  try {
    const { data } = await loxoClient.get(`/jobs/${jobId}/candidates`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching candidates for job ${jobId}:`, error.message || error);
    throw new Error(`Failed to fetch candidates for job ID ${jobId}`);
  }
}

/**
 * Fetch all workflow stages
 */
export async function fetchAllWorkflowStages() {
  try {
    const { data } = await loxoClient.get('/workflow_stages');
    return data; // array of workflow stages
  } catch (error) {
    console.error('❌ Error fetching workflow stages:', error.message || error);
    throw new Error('Failed to fetch workflow stages');
  }
}

/**
 * Fetch candidates from all jobs (only works if jobs exist and return valid candidates)
 */
// export async function fetchAllCandidatesFromAllJobs() {
//   try {
//     const result = await fetchJobs();

//     const jobs = result?.jobs?.results;

//     if (!Array.isArray(jobs)) {
//       throw new Error('Expected jobs to be an array');
//     }

//     let allCandidates = [];

//     for (const job of jobs) {
//       try {
//         console.log(`Fetching candidates for job ID: ${job.id} | Title: ${job.title}`);

//         const response = await fetchCandidatesByJob(job.id);
//         const candidates = response?.candidates || [];

//         // Add jobId and jobTitle to each candidate
//         const enriched = candidates.map(c => ({
//           ...c,
//           jobId: job.id,
//           jobTitle: job.title,
//           jobPublishedName: job.published_name
//         }));

//         allCandidates.push(...enriched);
//       } catch (innerError) {
//         console.warn(`⚠️ Failed to fetch candidates for job ID ${job.id}:`, innerError.message || innerError);
//         continue;
//       }
//     }

//     return allCandidates;
//   } catch (error) {
//     console.error('❌ Error in fetchAllCandidatesFromAllJobs:', error.message || error);
//     throw new Error('Failed to fetch candidates from all jobs');
//   }
// }

export async function fetchAllCandidatesFromAllJobs() {
  try {
    const result = await fetchJobs();

    const jobs = result?.jobs?.results;

    if (!Array.isArray(jobs)) {
      throw new Error('Expected jobs to be an array');
    }

    let allCandidates = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        console.log(`➡️  [${i + 1}/${jobs.length}] Fetching candidates for job ID: ${job.id} | Title: ${job.title}`);

        const response = await fetchCandidatesByJob(job.id);
        const candidates = response?.candidates || [];

        const enriched = candidates.map(c => ({
          ...c,
          jobId: job.id,
          jobTitle: job.title,
          jobPublishedName: job.published_name
        }));

        allCandidates.push(...enriched);
      } catch (innerError) {
        console.warn(`⚠️ Failed to fetch candidates for job ID ${job.id}:`, innerError.message || innerError);
        continue;
      }
    }

    return allCandidates;
  } catch (error) {
    console.error('❌ Error in fetchAllCandidatesFromAllJobs:', error.message || error);
    throw new Error('Failed to fetch candidates from all jobs');
  }
}
