import { z } from 'zod';

export const registerSchema = z.object({
  orgName: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, 'Token is required')
});
