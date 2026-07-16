import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env if not loaded already
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  MS1_PORT: z.string().regex(/^\d+$/, "MS1_PORT must be a valid number").transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().regex(/^\d+$/, "SMTP_PORT must be a valid number").transform(Number),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  DOCS_PORTAL_URL: z.string().url("DOCS_PORTAL_URL must be a valid URL"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables missing or improperly formatted.');
}

export const env = _env.data;
