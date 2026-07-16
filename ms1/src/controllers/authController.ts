import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/clientService';
import { registerSchema, verifyEmailQuerySchema } from '../schemas/authSchemas';
import { AppError } from '../errors/AppError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const { orgName, email, password } = parseResult.data;
    
    await clientService.registerNewClient(orgName, email, password);

    res.status(201).json({ message: 'check_your_email' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = verifyEmailQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const { token } = parseResult.data;
    
    await clientService.verifyClientEmail(token);

    res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    next(error);
  }
};
