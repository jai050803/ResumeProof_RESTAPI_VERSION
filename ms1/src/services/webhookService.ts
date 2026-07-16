import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const sendWebhookTestPing = async (webhookUrl: string, webhookSecret: string) => {
  const payload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    data: { message: 'Hello from ResumeProof API!' }
  };
  
  const payloadString = JSON.stringify(payload);
  
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadString)
    .digest('hex');

  try {
    const response = await axios.post(webhookUrl, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-rp-signature': signature
      },
      timeout: 10000 // 10s timeout
    });
    
    if (response.status >= 400) {
      throw new AppError('webhook_endpoint_unreachable', 400);
    }
  } catch (error) {
    logger.error('Webhook ping failed:', error);
    throw new AppError('webhook_endpoint_unreachable', 400);
  }
};
