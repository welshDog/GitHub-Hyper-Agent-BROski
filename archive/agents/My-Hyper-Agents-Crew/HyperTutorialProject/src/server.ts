import Fastify from 'fastify';
import pino from 'pino';
import { db, initDB } from './db/index.js';
import { agents, workflows } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { BroskiOrchestratorService } from './services/orchestrator.service.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { connection as redisConnection } from './services/queue.service.js';
import { fileURLToPath } from 'url';
import { register, initMetrics } from './services/metrics.service.js';

// Validation Schema for POST /workflows
const WorkflowSchema = z.object({
  userId: z.string().uuid(),
  prompt: z.string().min(1).max(10000),
  options: z.object({
    timeout: z.number().optional().default(30000),
    retryLimit: z.number().optional().default(3),
  }).optional(),
});

const WorkflowResponseSchema = z.object({
    workflowId: z.number(),
    status: z.string(),
    createdAt: z.string()
});

const WorkflowStatusSchema = z.object({
    workflowId: z.number(),
    status: z.string(),
    userRequest: z.string(),
    createdAt: z.string().nullable()
});

export const buildServer = async () => {
  const server = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Setup Zod Validator
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Register Swagger
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'HyperTutorialProject API',
        description: 'API for Broski Agents Orchestration',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
    transform: jsonSchemaTransform,
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  const orchestratorService = new BroskiOrchestratorService();

  // Root route
  server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'HyperTutorialProject API' };
  });

  // Health check
  server.get('/health', async (request, reply) => {
    return { status: 'ok', uptime: process.uptime() };
  });

  // Readiness probe (API + Redis)
  server.get('/health/ready', async (request, reply) => {
    try {
      const redisStatus = await redisConnection.ping();
      if (redisStatus === 'PONG') {
        return { status: 'ready', redis: 'connected', uptime: process.uptime() };
      } else {
        reply.code(503);
        return { status: 'not_ready', redis: 'disconnected' };
      }
    } catch (err) {
      request.log.error(err, 'Readiness check failed');
      reply.code(503);
      return { status: 'not_ready', redis: 'error', error: String(err) };
    }
  });

  // Agents endpoint (Test DB connection)
  server.get('/agents', async (request, reply) => {
    const result = await db.select().from(agents).all();
    return { agents: result };
  });

  // Prometheus Metrics Endpoint
  server.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Create Workflow Endpoint
  server.post('/workflows', {
      schema: {
          body: WorkflowSchema,
          response: {
              202: WorkflowResponseSchema
          }
      }
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof WorkflowSchema>; // Explicitly typed because we use the zod provider
      
    // Create workflow
    const workflowId = await orchestratorService.createWorkflow(body.prompt);
      
    if (process.env.USE_BULLMQ === 'false') {
         // Old way (Legacy Promise-based)
         orchestratorService.executeWorkflow(workflowId).catch(err => {
             request.log.error(err, 'Async workflow execution failed');
         });
         request.log.info({ workflowId }, 'Workflow started (Legacy Mode)');
    } else {
         // Enqueue job to BullMQ
         const jobId = await orchestratorService.enqueueWorkflow(workflowId);
         request.log.info({ workflowId, jobId }, 'Workflow enqueued');
    }

    reply.header('Location', `/workflows/${workflowId}`);
    reply.code(202).send({
      workflowId,
      status: 'queued',
      createdAt: new Date().toISOString()
    });
  });

  // Get Workflow Status Endpoint
  server.get('/workflows/:id', {
      schema: {
          params: z.object({ id: z.string() }),
          response: {
              200: WorkflowStatusSchema,
              404: z.object({ error: z.string() }),
              400: z.object({ error: z.string() })
          }
      }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const workflowId = parseInt(id); // Drizzle uses integers for IDs

    if (isNaN(workflowId)) {
        return reply.code(400).send({ error: 'Invalid ID format' });
    }

    const workflow = await orchestratorService.getWorkflow(workflowId);

    if (!workflow) {
      return reply.code(404).send({ error: 'Workflow not found' });
    }

    return {
      workflowId: workflow.id,
      status: workflow.status,
      userRequest: workflow.userRequest,
      createdAt: workflow.createdAt
    };
  });

  return server;
};

const start = async () => {
  try {
    initDB();
    initMetrics(); // Start metrics collection
    const server = await buildServer();
    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info(`Server running at http://localhost:3000`);
    server.log.info(`Swagger docs available at http://localhost:3000/docs`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    start();
}
