import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

const parseHeaders = (raw?: string): Record<string, string> | undefined => {
  if (!raw) {
    return undefined;
  }
  return raw.split(',').reduce<Record<string, string>>((headers, item) => {
    const [key, value] = item.split('=').map((part) => part.trim());
    if (key && value) {
      headers[key] = value;
    }
    return headers;
  }, {});
};

export async function bootstrapTelemetry() {
  if (sdk || process.env.OTEL_ENABLED !== 'true') {
    return sdk;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'missed-monitor-api',
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  return sdk;
}

export async function shutdownTelemetry() {
  if (!sdk) {
    return;
  }
  await sdk.shutdown();
  sdk = null;
}
