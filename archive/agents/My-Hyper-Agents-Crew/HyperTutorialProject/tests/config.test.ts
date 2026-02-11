import { jest, describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { loadConfig } from '../src/config.js';


describe('Configuration System', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should load valid configuration with defaults', () => {
    // Force NODE_ENV to undefined to test default fallback
    delete process.env.NODE_ENV;

    // Setup minimal required env vars
    process.env.DB_USER = 'test_user';
    process.env.DB_PASS = 'test_pass';
    
    // We point to the actual settings.yaml for integration test
    const config = loadConfig();

    expect(config.env).toBe('development'); // Default
    expect(config.database.username).toBe('test_user');
    expect(config.studio.hardware.microphone.recommended).toContain('Shure SM7B');
  });

  test('should substitute environment variables', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_USER = 'prod_user';
    process.env.DB_PASS = 'prod_pass';
    process.env.PORT = '8080';

    const config = loadConfig();

    expect(config.env).toBe('production');
    expect(config.port).toBe(8080);
    expect(config.database.username).toBe('prod_user');
  });

  test('should throw error if required secrets are missing', () => {
    // Unset required DB vars
    delete process.env.DB_USER;
    delete process.env.DB_PASS;

    // It should throw because Zod schema requires min(1) string
    expect(() => {
        loadConfig();
    }).toThrow("Invalid Configuration");
  });

  test('should validate studio configuration constraints', () => {
    process.env.DB_USER = 'user';
    process.env.DB_PASS = 'pass';
    
    // We can't easily modify the YAML file in this test without mocking fs,
    // but we can rely on the fact that if the YAML was invalid, loadConfig would throw.
    // Let's verify specific studio values are loaded.
    const config = loadConfig();
    
    expect(config.studio.software.font.size.editor).toBeGreaterThanOrEqual(16);
    expect(config.studio.software.font.size.terminal).toBeGreaterThanOrEqual(16);
    expect(config.studio.recording.obs.bitrateKbps).toBeGreaterThan(10000);
  });
});
