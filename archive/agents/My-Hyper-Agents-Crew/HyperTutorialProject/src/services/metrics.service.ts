
import client from 'prom-client';
import { QueueEvents } from 'bullmq';
import { connection, workflowQueue } from './queue.service.js';
import pino from 'pino';

const logger = pino({ name: 'metrics-service' });

// Registry
export const register = new client.Registry();

// Default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({ register });

// Metrics
const jobsCompleted = new client.Counter({
  name: 'bullmq_jobs_completed_total',
  help: 'Total number of completed jobs',
  labelNames: ['queue'],
});

const jobsFailed = new client.Counter({
  name: 'bullmq_jobs_failed_total',
  help: 'Total number of failed jobs',
  labelNames: ['queue'],
});

const queueWaiting = new client.Gauge({
    name: 'bullmq_queue_waiting_count',
    help: 'Number of jobs waiting in queue',
    labelNames: ['queue']
});

const queueActive = new client.Gauge({
    name: 'bullmq_queue_active_count',
    help: 'Number of active jobs in queue',
    labelNames: ['queue']
});

register.registerMetric(jobsCompleted);
register.registerMetric(jobsFailed);
register.registerMetric(queueWaiting);
register.registerMetric(queueActive);

// Initialize listeners
export function initMetrics() {
    const queueName = 'workflow-queue';
    const queueEvents = new QueueEvents(queueName, { connection });

    queueEvents.on('completed', ({ jobId }) => {
        jobsCompleted.inc({ queue: queueName });
        logger.info({ jobId }, 'Metric: Job Completed');
    });

    queueEvents.on('failed', ({ jobId }) => {
        jobsFailed.inc({ queue: queueName });
        logger.info({ jobId }, 'Metric: Job Failed');
    });

    // Poll for queue depths
    setInterval(async () => {
        try {
            const counts = await workflowQueue.getJobCounts('waiting', 'active');
            queueWaiting.set({ queue: queueName }, counts.waiting);
            queueActive.set({ queue: queueName }, counts.active);
        } catch (err) {
            logger.error(err, 'Failed to update queue metrics');
        }
    }, 5000); // Update every 5 seconds
}
