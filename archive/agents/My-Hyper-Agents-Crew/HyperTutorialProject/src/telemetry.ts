import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { fileURLToPath } from 'url';
// import { config } from './config.js';

export const sdk = new NodeSDK({
  resource: undefined,
  instrumentations: [getNodeAutoInstrumentations()],
});

export function startTelemetry() {
  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startTelemetry();
}
