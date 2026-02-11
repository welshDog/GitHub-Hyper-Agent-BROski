import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPrompt = jest.fn() as jest.Mock<any>;
const mockLog = jest.fn();
const mockClear = jest.fn();

jest.unstable_mockModule('inquirer', () => ({
  default: { prompt: mockPrompt },
}));

jest.unstable_mockModule('../src/config.js', () => ({
  loadConfig: jest.fn().mockReturnValue({ env: 'test' }),
}));

// Mock console
jest.spyOn(console, 'log').mockImplementation(mockLog);
jest.spyOn(console, 'clear').mockImplementation(mockClear);

const { runSystemHealthCheck, runPurchaseChecklist } = await import('../src/power-moves.js');

describe('Power Moves CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runSystemHealthCheck should run diagnostics', async () => {
    mockPrompt.mockResolvedValueOnce({ continue: '' });
    
    await runSystemHealthCheck(true);
    
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Running Diagnostics'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('All Systems Nominal'));
  });

  test('runPurchaseChecklist should identify missing items', async () => {
    mockPrompt.mockResolvedValueOnce({ hardware: ['ups', 'cables'] }); // Only 2 items
    mockPrompt.mockResolvedValueOnce({ continue: '' });

    await runPurchaseChecklist();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('You are missing 3 items'));
  });

  test('runPurchaseChecklist should congratulate on full stack', async () => {
    mockPrompt.mockResolvedValueOnce({ hardware: ['ups', 'conditioner', 'gan', 'cables', 'tester'] });
    mockPrompt.mockResolvedValueOnce({ continue: '' });

    await runPurchaseChecklist();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('EXCELLENT'));
  });
});
