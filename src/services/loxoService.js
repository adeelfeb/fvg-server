// src/services/loxoService.js
import loxoClient from './loxoClient.js';

export async function fetchJobs() {
  const { data } = await loxoClient.get('/jobs');
  return data;
}

export async function applyToJob(jobId, candidateData) {
  const { data } = await loxoClient.post(`/jobs/${jobId}/apply`, {
    person: candidateData
  });
  return data;
}

export async function fetchCandidatesByJob(jobId) {
  const { data } = await loxoClient.get(`/jobs/${jobId}/candidates`);
  return data;
}



////////////////////////





export async function fetchWorkflowsWithStages() {
  // pulls all pipelines with embedded stage arrays
  const { data } = await loxoClient.get('/deal_workflows');
  return data; // array of workflows
}

export async function fetchAllWorkflowStages() {
  const { data } = await loxoClient.get('/workflow_stages');
  return data; // flat array of stages
}
