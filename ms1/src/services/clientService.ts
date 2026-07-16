import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as clientRepository from '../repositories/clientRepository';
import { sendEmailVerificationLink } from './emailService';
import { AppError } from '../errors/AppError';

export const registerNewClient = async (orgName: string, email: string, passwordRaw: string) => {
  const existingClient = await clientRepository.findClientByEmail(email);
  if (existingClient) {
    throw new AppError('email_already_registered', 409);
  }

  const passwordHash = await bcrypt.hash(passwordRaw, 10);
  
  const client = await clientRepository.createClient({
    name: orgName,
    email,
    passwordHash
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await clientRepository.createEmailVerification({
    clientId: client.id,
    tokenHash,
    expiresAt
  });

  await sendEmailVerificationLink(email, rawToken);

  return client;
};

export const verifyClientEmail = async (rawToken: string) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  const verification = await clientRepository.findEmailVerificationByHash(tokenHash);
  if (!verification) {
    throw new AppError('invalid_or_expired_token', 400);
  }

  if (new Date() > verification.expiresAt) {
    await clientRepository.deleteEmailVerification(verification.id);
    throw new AppError('invalid_or_expired_token', 400);
  }

  await clientRepository.markEmailVerified(verification.clientId);
  await clientRepository.deleteEmailVerification(verification.id);

  return { success: true };
};

export const authenticateClient = async (email: string, passwordRaw: string) => {
  const client = await clientRepository.findClientByEmail(email);
  
  if (!client) {
    throw new AppError('invalid_credentials', 401);
  }

  if (!client.isVerified) {
    throw new AppError('email_not_verified', 403);
  }

  const isMatch = await bcrypt.compare(passwordRaw, client.passwordHash);
  if (!isMatch) {
    throw new AppError('invalid_credentials', 401);
  }

  const { issueTokenPair } = await import('./jwtService');
  return issueTokenPair(client.id, client.email);
};
