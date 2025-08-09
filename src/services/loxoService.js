// src/services/loxoService.js
import loxoClient from './loxoClient.js';

export async function fetchJobs() {
  const allJobs = [];
  let scrollId = null;

  try {
    do {
      const params = { per_page: 100 }; // Max page size
      if (scrollId) {
        params.scroll_id = scrollId;
      }

      const { data } = await loxoClient.get('/jobs', { params });

      if (Array.isArray(data?.results)) {
        allJobs.push(...data.results);
      }

      scrollId = data?.scroll_id;
    } while (scrollId);
    return { jobs: { results: allJobs } };
  } catch (error) {
    console.error('❌ Error fetching jobs:', error.message || error);
    throw new Error('Failed to fetch jobs from Loxo');
  }
}


////////

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


export async function fetchCandidatesByJob(jobId) {
  const allCandidates = [];
  let scrollId = null;

  try {
    do {
      const params = { per_page: 100 };  
      if (scrollId) {
        params.scroll_id = scrollId;
      }

      const { data } = await loxoClient.get(`/jobs/${jobId}/candidates`, { params });
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        allCandidates.push(...data.candidates);
      }
      scrollId = data?.scroll_id;
    } while (scrollId);
    return allCandidates;
  } catch (error) {
    console.error(`❌ Error fetching all candidates for job ${jobId}:`, error.message || error);
    throw new Error(`Failed to fetch all candidates for job ID ${jobId}`);
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
        console.log(`➡️  [${i + 1}/${jobs.length}]`);
        const candidates = await fetchCandidatesByJob(job.id);
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
