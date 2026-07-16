import { Request, Response, NextFunction } from 'express';
import * as verificationService from '../services/verificationService';
import { AppError } from '../errors/AppError';

export const submitVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.clientId) throw new AppError('unauthorized', 401);
    if (!req.file) throw new AppError('resume_file_missing', 400);

    const { githubUrl } = req.body;
    
    const result = await verificationService.initiateVerification(req.clientId, githubUrl, req.file);
    
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
};
