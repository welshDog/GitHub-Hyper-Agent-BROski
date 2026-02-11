import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPrompt = jest.fn() as jest.Mock<any>;
const mockMkdir = jest.fn();
const mockWrite = jest.fn();
const mockExists = jest.fn();

jest.unstable_mockModule('inquirer', () => ({
  default: { prompt: mockPrompt },
}));

jest.unstable_mockModule('fs', () => ({
  default: {
    mkdirSync: mockMkdir,
    writeFileSync: mockWrite,
    existsSync: mockExists,
  },
  mkdirSync: mockMkdir,
  writeFileSync: mockWrite,
  existsSync: mockExists,
}));

// Import module under test dynamically after mocking
const { main } = await import('../src/scaffold.js');

describe('Scaffold Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExists.mockReturnValue(false); 
  });

  test('should generate module files', async () => {
    mockPrompt.mockResolvedValueOnce({ name: 'test-feature' });

    await main();

    expect(mockMkdir).toHaveBeenCalledTimes(3);
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('test-feature'), expect.any(Object));

    expect(mockWrite).toHaveBeenCalledTimes(3);
    
    const apiCall = mockWrite.mock.calls.find((call: any) => call[0].endsWith('index.ts'));
    expect(apiCall).toBeDefined();
    if (apiCall) expect(apiCall[1]).toContain('export async function testFeature');

    const testCall = mockWrite.mock.calls.find((call: any) => call[0].endsWith('test-feature.test.ts'));
    expect(testCall).toBeDefined();
    if (testCall) expect(testCall[1]).toContain("test('test-feature works'");
  });
});
