import { jest, describe, test, expect, afterEach } from '@jest/globals';
import { startTelemetry, sdk } from '../src/telemetry.js';

jest.mock('@opentelemetry/sdk-node');
jest.mock('@opentelemetry/auto-instrumentations-node');

describe('Telemetry', () => {
  const mockStart = jest.spyOn(sdk, 'start').mockImplementation(() => Promise.resolve());
  const mockShutdown = jest.spyOn(sdk, 'shutdown').mockImplementation(() => Promise.resolve());
  jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should start SDK', () => {
    startTelemetry();
    expect(mockStart).toHaveBeenCalled();
  });

  test('should handle SIGTERM', async () => {
    startTelemetry();
    
    // Simulate SIGTERM
    process.emit('SIGTERM', 'SIGTERM');

    // Wait a tick
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockShutdown).toHaveBeenCalled();
  });
});
