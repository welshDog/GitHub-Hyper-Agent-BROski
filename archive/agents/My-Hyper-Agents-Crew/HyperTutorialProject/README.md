# HyperTutorialProject - Broski Orchestrator

## Architecture
The system uses a Broski Orchestrator Service to manage agent workflows.
Milestone 2.3 introduces an Async Engine using BullMQ and Redis for robust, crash-resilient job processing.

### Async Engine (BullMQ + Redis)
- **Producer**: API enqueues workflows to Redis (`queue.service.ts`).
- **Consumer**: Worker process (`workflowWorker.ts`) picks up jobs and executes orchestration logic.
- **Persistence**: Redis 7.
- **Reliability**: Automatic retries (exponential backoff), Dead Letter Queue (DLQ), and Idempotency checks.

## Local Setup

1. **Prerequisites**:
   - Node.js >= 18
   - Docker (for Redis)

2. **Start Redis**:
   ```bash
   docker-compose -f docker-compose.redis.yml up -d
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and set:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=broski_secret
   WORKFLOW_RETRY_ATTEMPTS=3
   WORKFLOW_RETRY_DELAY=2000
   WORKFLOW_FAILURE_WEBHOOK=https://example.com/webhook
   ```

5. **Start API Server**:
   ```bash
   # Run the server (ensure build is done or use tsx)
   npx tsx src/server.ts
   ```

6. **Start Worker**:
   ```bash
   npm run worker:start
   ```

## Migration
To migrate from legacy in-memory promises to BullMQ:
```bash
npm run migrate:to-bullmq
```

To rollback/use legacy mode, set `USE_BULLMQ=false` in `.env`.

## Troubleshooting
- **Redis Connection Failed**: Check if Docker container is running (`docker ps`). Ensure password matches `.env`.
- **Jobs Stuck**: Check Prometheus metrics at `/metrics`. Check `failed-workflow` queue in Redis.
- **Worker not processing**: Ensure `npm run worker:start` is running.

## API Documentation
Swagger UI available at `/docs`.

### POST /workflows
Returns `202 Accepted` with `Location` header.

```json
{
  "workflowId": 123,
  "status": "queued",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```
