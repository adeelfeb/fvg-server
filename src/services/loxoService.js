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
