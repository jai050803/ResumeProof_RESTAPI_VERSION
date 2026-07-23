import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('ms1-gateway');

// Counters (ever-increasing)
export const verificationSubmitted = meter.createCounter('ms1.verify.submitted', {
  description: 'Total verification requests submitted',
});

export const verificationCompleted = meter.createCounter('ms1.verify.completed', {
  description: 'Total verifications completed (done or failed)',
});

export const webhookDispatched = meter.createCounter('ms1.webhook.dispatched', {
  description: 'Total webhook dispatch attempts',
});

export const webhookDelivered = meter.createCounter('ms1.webhook.delivered', {
  description: 'Total successful webhook deliveries',
});

export const authAttempts = meter.createCounter('ms1.auth.attempts', {
  description: 'Login attempts by result',
  // Use attributes: { result: 'success' | 'failure' }
});

// Histograms (distribution of values)
export const verificationDurationMs = meter.createHistogram(
  'ms1.verify.duration_ms', {
  description: 'End-to-end verification processing time in ms',
  unit: 'ms',
  advice: { explicitBucketBoundaries: [1000, 5000, 15000, 30000, 60000, 120000, 300000] }
});

export const webhookLatencyMs = meter.createHistogram(
  'ms1.webhook.latency_ms', {
  description: 'Time taken to deliver a webhook payload in ms',
  unit: 'ms',
});
