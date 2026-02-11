
import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';

// Mocks must be declared before imports
const mockAdd = jest.fn();
const mockQueue = jest.fn(() => ({
  add: mockAdd,
}));

const mockWorkerInstance = {
  on: jest.fn(),
  close: jest.fn(),
};
const mockWorker = jest.fn(() => mockWorkerInstance);

// Mock Redis
const mockRedis = jest.fn(() => ({
  ping: jest.fn().mockResolvedValue('PONG'),
})) as any;

// Mock OrchestratorService
const mockExecuteWorkflow = jest.fn();
const mockOrchestratorService = jest.fn(() => ({
  executeWorkflow: mockExecuteWorkflow,
}));

jest.unstable_mockModule('bullmq', () => ({
  Queue: mockQueue,
  Worker: mockWorker,
}));

jest.unstable_mockModule('ioredis', () => ({
  Redis: mockRedis,
}));

jest.unstable_mockModule('../src/services/orchestrator.service.js', () => ({
  BroskiOrchestratorService: mockOrchestratorService,
}));

// Import modules under test dynamically to apply mocks
const { enqueueWorkflowJob } = await import('../src/services/queue.service.js');

describe('Async Engine', () => {
  beforeAll(() => {
    jest.clearAllMocks();
  });

  describe('Queue Service (Producer)', () => {
    it('should enqueue a workflow job with correct options', async () => {
      const workflowId = 123;
      const jobId = await enqueueWorkflowJob(workflowId);

      expect(jobId).toContain(`workflow-${workflowId}-`);
      expect(mockAdd).toHaveBeenCalledWith(
        'process-workflow',
        { workflowId },
        expect.objectContaining({
          jobId: expect.stringContaining(`workflow-${workflowId}-`),
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        })
      );
    });
  });

  describe('Workflow Worker (Consumer)', () => {
    let workflowWorkerModule: any;
    let processor: Function;

    beforeAll(async () => {
        // Re-import to trigger worker creation if needed, 
        // but since it's a side-effect at top level, it runs once.
        // We can inspect the mockWorker calls.
        workflowWorkerModule = await import('../src/workers/workflowWorker.js');
        
        // Get the processor function passed to the Worker constructor
        // call args: [queueName, processor, options]
        const calls = (mockWorker as unknown as jest.Mock).mock.calls;
        // Assuming the last call is our worker
        processor = calls[calls.length - 1][1] as Function;
    });

    it('should process a job successfully', async () => {
      const mockJob = {
        id: 'job-1',
        data: { workflowId: 456 },
        updateProgress: jest.fn(),
        returnvalue: null
      };

      await processor(mockJob);

      expect(mockJob.updateProgress).toHaveBeenCalledWith(10);
      expect(mockExecuteWorkflow).toHaveBeenCalledWith(456);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should throw error if orchestration fails', async () => {
      mockExecuteWorkflow.mockRejectedValueOnce(new Error('Orchestration failed') as any);
      
      const mockJob = {
        id: 'job-2',
        data: { workflowId: 789 },
        updateProgress: jest.fn(),
        opts: { attempts: 3 },
        attemptsMade: 1
      };

      await expect(processor(mockJob)).rejects.toThrow('Orchestration failed');
      expect(mockJob.updateProgress).toHaveBeenCalledWith(10); // Should reach 10
      // Should NOT reach 100
      expect(mockJob.updateProgress).not.toHaveBeenCalledWith(100);
    });
  });
});
