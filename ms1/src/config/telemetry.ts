import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION }
  from '@opentelemetry/semantic-conventions';

const isOtelEnabled = process.env.OTEL_ENABLED === 'true';

export function initTelemetry() {
  if (!isOtelEnabled) {
    console.log('[OTel] Disabled. Set OTEL_ENABLED=true to enable.');
    return;
  }

  const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ?? 'http://localhost:4318';

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'ms1-gateway',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? '1.0.0',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${collectorEndpoint}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${collectorEndpoint}/v1/metrics`,
      }),
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log('[OTel] SDK started. Exporting to:', collectorEndpoint);

  process.on('SIGTERM', async () => {
    await sdk.shutdown();
    console.log('[OTel] SDK shut down.');
  });
}
