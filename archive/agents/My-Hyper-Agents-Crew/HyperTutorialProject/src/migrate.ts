
import { db, initDB } from './db/index.js';
import { workflows } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { enqueueWorkflowJob, connection } from './services/queue.service.js';
import pino from 'pino';

const logger = pino({ 
    name: 'migration-script',
    transport: { target: 'pino-pretty' }
});

async function migrate() {
  logger.info('Starting migration to BullMQ...');
  initDB();

  // Find stuck workflows
  // 'queued' means they were accepted but maybe not started (if server crashed immediately)
  // 'processing' means they were running in-memory and lost.
  const stuckWorkflows = await db.select().from(workflows).where(inArray(workflows.status, ['queued', 'processing']));

  logger.info(`Found ${stuckWorkflows.length} stuck workflows.`);

  for (const workflow of stuckWorkflows) {
    logger.info(`Migrating workflow ${workflow.id}...`);
    
    try {
        // Reset status to queued so the worker picks it up fresh
        await db.update(workflows).set({ status: 'queued' }).where(eq(workflows.id, workflow.id));
        
        // Enqueue
        const jobId = await enqueueWorkflowJob(workflow.id);
        logger.info(`Workflow ${workflow.id} enqueued as job ${jobId}`);
    } catch (err) {
        logger.error({ err, workflowId: workflow.id }, 'Failed to migrate workflow');
    }
  }

  logger.info('Migration complete.');
  
  // Give a moment for Redis commands to flush
  await new Promise(resolve => setTimeout(resolve, 1000));
  await connection.quit();
}

migrate().catch(err => {
    logger.error(err);
    process.exit(1);
});
