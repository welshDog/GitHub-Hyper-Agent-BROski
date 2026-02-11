
import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { BroskiOrchestratorService } from '../services/orchestrator.service.js';
import pino from 'pino';

// Setup Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'broski_secret',
  maxRetriesPerRequest: null,
});

const orchestratorService = new BroskiOrchestratorService();

export const workflowWorker = new Worker(
  'workflow-queue',
  async (job: Job) => {
    const { workflowId } = job.data;
    logger.info({ jobId: job.id, workflowId }, '🚀 Processing Workflow Job');

    try {
      await job.updateProgress(10);
      await orchestratorService.executeWorkflow(workflowId);
      await job.updateProgress(100);
      logger.info({ jobId: job.id, workflowId }, '✅ Workflow Job Completed');
    } catch (error) {
      logger.error({ jobId: job.id, workflowId, err: error }, '❌ Workflow Job Failed');
      throw error; // Triggers BullMQ retry
    }
  },
  { 
    connection,
    concurrency: 5 // Process 5 workflows in parallel
  }
);

workflowWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '💀 Job Failed (Will Retry if attempts remain)');
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await workflowWorker.close();
});
