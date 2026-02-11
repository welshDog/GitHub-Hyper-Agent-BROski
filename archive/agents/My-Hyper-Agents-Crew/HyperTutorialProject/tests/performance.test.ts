
import { describe, test, expect } from '@jest/globals';
import { performance } from 'perf_hooks';
import { loadConfig } from '../src/config.js';

describe('System Performance', () => {
  test('Configuration load time should be under 50ms', () => {
    const start = performance.now();
    loadConfig();
    const end = performance.now();
    const duration = end - start;
    
    // First load might be slower due to I/O, but 50ms is a generous budget for local file read
    expect(duration).toBeLessThan(50); 
  });
});
