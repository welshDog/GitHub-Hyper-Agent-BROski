// src/telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { fileURLToPath } from "url";
var sdk = new NodeSDK({
  resource: void 0,
  instrumentations: [getNodeAutoInstrumentations()]
});
function startTelemetry() {
  sdk.start();
  process.on("SIGTERM", () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startTelemetry();
}
export {
  sdk,
  startTelemetry
};
