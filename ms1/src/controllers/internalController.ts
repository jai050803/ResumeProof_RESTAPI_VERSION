import { Request, Response, NextFunction } from 'express';
import * as resultRepository from '../repositories/resultRepository';
import * as transactionRepository from '../repositories/transactionRepository';
import * as webhookService from '../services/webhookService';

export const handleResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, clientId, resultData } = req.body;

    const result = await resultRepository.createResult({
      transactionId,
      confidenceScore: resultData.confidenceScore,
      status: resultData.status,
      githubUsername: resultData.githubUsername,
      reposFound: resultData.reposFound,
      claimedProjects: resultData.claimedProjects,
      verifiedProjects: resultData.verifiedProjects,
      commitAuthorship: resultData.commitAuthorship,
      skillAlignment: resultData.skillAlignment,
      matchedSkills: resultData.matchedSkills,
      missingSkills: resultData.missingSkills,
      flags: resultData.flags,
      rawGithubData: resultData.rawGithubData,
      aiAnalysis: resultData.aiAnalysis
    });

    await transactionRepository.updateTransactionComplete(transactionId);

    // Dispatch webhook asynchronously
    webhookService.dispatchWebhook(transactionId, clientId, {
      event: 'verification.completed',
      data: result
    }).catch(err => {
      // swallow error so we don't crash or return 500
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
