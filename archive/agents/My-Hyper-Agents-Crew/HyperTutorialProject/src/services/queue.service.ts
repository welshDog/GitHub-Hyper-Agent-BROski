
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection config
export const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'broski_secret',
  maxRetriesPerRequest: null,
});

// Create workflow queue
export const workflowQueue = new Queue('workflow-queue', { connection });

export interface WorkflowJobData {
  workflowId: number;
}

/**
 * Enqueue a workflow job.
 * @param workflowId The ID of the workflow to process.
 * @returns The job ID.
 */
export async function enqueueWorkflowJob(workflowId: number): Promise<string> {
  const jobId = `workflow-${workflowId}-${Date.now()}`;
  
  await workflowQueue.add('process-workflow', { workflowId }, {
    jobId,
    attempts: parseInt(process.env.WORKFLOW_RETRY_ATTEMPTS || '3'),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.WORKFLOW_RETRY_DELAY || '2000'),
    },
    removeOnComplete: true, // Auto-cleanup successful jobs
    removeOnFail: false, // Keep failed jobs for inspection
  });

  return jobId;
}
