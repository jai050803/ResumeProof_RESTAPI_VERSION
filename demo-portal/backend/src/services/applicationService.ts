import * as applicationRepository from '../repositories/applicationRepository';
import * as jobService from './jobService';
import { CreateApplicationDto } from '../repositories/applicationRepository';

export const submitApplication = async (data: CreateApplicationDto) => {
  // Validate job exists
  await jobService.getJobById(data.jobId);
  
  const applicationId = await applicationRepository.createApplication(data);
  return applicationId;
};

export const getAllApplications = async () => {
  return await applicationRepository.findAllApplications();
};

export const getApplicationsByJob = async (jobId: string) => {
  return await applicationRepository.findApplicationsByJob(jobId);
};
