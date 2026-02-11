import { NodeSDK } from '@opentelemetry/sdk-node';

declare const sdk: NodeSDK;
declare function startTelemetry(): void;

export { sdk, startTelemetry };
