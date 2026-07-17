import { Request, Response, NextFunction } from 'express';
import * as resultRepository from '../repositories/resultRepository';
import * as transactionRepository from '../repositories/transactionRepository';
import * as webhookService from '../services/webhookService';
import { getPrismaClient } from '../config/prismaClient';

const prisma = getPrismaClient();

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

export const getTransactionDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx) {
      res.status(404).json({ error: 'transaction_not_found' });
      return;
    }

    res.status(200).json({
      githubUrl: tx.githubUrl,
      resumeText: tx.resumeText,
      jdText: tx.jdText,
      clientId: tx.clientId
    });
  } catch (error) {
    next(error);
  }
};

export const handleStatusUpdate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, status, errorMessage } = req.body;

    if (status === 'active') {
      await prisma.job.updateMany({
        where: { transactionId },
        data: {
          status: 'active',
          attempts: { increment: 1 },
          startedAt: new Date()
        }
      });
    } else if (status === 'done' || status === 'completed') {
      await prisma.job.updateMany({
        where: { transactionId },
        data: {
          status: 'done',
          finishedAt: new Date()
        }
      });
    } else if (status === 'failed') {
      await prisma.job.updateMany({
        where: { transactionId },
        data: {
          status: 'failed',
          errorMessage: errorMessage || 'Failed',
          finishedAt: new Date()
        }
      });
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed' }
      });
    } else if (status === 'processing') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'processing' }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
