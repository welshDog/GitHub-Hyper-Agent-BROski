# Hyper-Upgrade Strategy: From CLI to Enterprise Agent Platform

This comprehensive strategy outlines the transformation of `HyperTutorialProject` from a local CLI tool into a scalable, secure, and observable microservices-based agent platform.

## 1. Architecture Review: Decoupling & Microservices

**Current State:** Monolithic CLI where `power-moves.ts` directly instantiates `BroskiOrchestrator`.
**Goal:** Separation of Concerns (SoC) with a dedicated API layer.

*   **Core Domain Layer:** Extract `src/agents/` into a pure logic layer (or separate package) that is interface-agnostic.
*   **API Service:** Create a new entry point `src/server.ts` using **Fastify** or **Hono** (lighter/faster than Express) to expose agent capabilities.
*   **Worker Queue:** Implement **BullMQ** (Redis-based) to handle long-running agent tasks asynchronously. This prevents API timeouts during complex orchestrations.
*   **CLI Client:** Refactor `src/power-moves.ts` to be a thin client that consumes the new API rather than running logic locally.

## 2. Security: Hardening the Core

**Current State:** Basic `.env` loading; no input sanitization beyond Zod in specific spots.

*   **Input Validation:** Enforce strict Zod schemas for *all* API endpoints and agent inputs to prevent injection attacks.
*   **Authentication:** Implement API Key authentication (middleware) for the new API service.
*   **Secret Management:** Move from `.env` files to a secrets manager (e.g., AWS Secrets Manager or HashiCorp Vault) for production.
*   **Sandboxing:** Run agent code execution (if any) in isolated environments (e.g., Docker containers or Firecracker microVMs) to prevent host system compromise.

## 3. Code Optimization: Performance & Cost

**Current State:** Sequential execution (`for...of` loop in `orchestrator.ts`), no caching.

*   **Parallel Execution:** Refactor `BroskiOrchestrator` to execute subtasks in parallel (`Promise.all`) where dependencies allow.
    *   *Action:* Update `TaskPlan` schema to explicitly define dependencies (DAG structure).
*   **Semantic Caching:** Implement a semantic cache (Redis + Vector Store) for LLM calls. If a similar prompt was asked recently, return the cached response to save cost and time.
*   **Retry Logic:** Add exponential backoff retries in `callLLM` (using `axios-retry` or custom logic) to handle transient OpenAI errors gracefully.

## 4. Scalability: Containerization

*   **Dockerization:** Create a multi-stage `Dockerfile` for the API service.
    *   *Build Stage:* Compile TypeScript.
    *   *Run Stage:* Minimal Node.js Alpine image.
*   **Orchestration:** Create a `docker-compose.yml` to spin up:
    *   API Service
    *   Redis (for Queue & Cache)
    *   Postgres (Database)
    *   Frontend Dashboard

## 5. Database: Persistent Memory

**Current State:** In-memory `BroskiState`. Data is lost on exit.

*   **Technology:** **PostgreSQL** (Production) / **SQLite** (Dev).
*   **ORM:** Use **Prisma** or **Drizzle** for type-safe database interactions.
*   **Schema:**
    *   `Workflows`: Stores the overall request and status.
    *   `Tasks`: Stores individual subtasks, assigned agents, and outputs.
    *   `AgentMemory`: Long-term vector storage for agent context recall.

## 6. Frontend: React Dashboard

**Goal:** A visual interface to monitor and interact with agents.

*   **Stack:** **Vite + React + TailwindCSS**.
*   **Features:**
    *   **Live Stream:** WebSocket connection to stream agent logs/thoughts in real-time.
    *   **Graph View:** Visualization of the subtask dependency graph (DAG).
    *   **History:** Browsable list of past workflows and their outcomes.
    *   **Interactive Input:** Form to submit new requests and approve "Safety" checks manually.

## 7. API Design: GraphQL & REST

*   **Hybrid Approach:**
    *   **REST:** Standard endpoints for CRUD (Create Workflow, Get Status).
    *   **GraphQL:** Flexible querying for complex nested data (e.g., Workflow -> Tasks -> Agent Logs).
*   **Documentation:** Auto-generate Swagger/OpenAPI specs from Zod schemas using `@asteasolutions/zod-to-openapi`.

## 8. DevOps: CI/CD Pipeline

*   **GitHub Actions:**
    *   `ci.yml`: Runs on PR. Executes `eslint`, `prettier`, `tsc`, and `jest`.
    *   `cd.yml`: Runs on merge to main. Builds Docker image and pushes to registry (GHCR/DockerHub).
*   **Infrastructure as Code (IaC):** Use **Terraform** or **Pulumi** to define cloud resources (if deploying to AWS/Azure).

## 9. Monitoring: Enhanced Observability

**Current State:** Basic OpenTelemetry setup.

*   **Tracing:** Add custom spans for each agent execution and subtask.
    *   *Attribute:* `agent.name`, `token.usage`, `latency.ms`.
*   **Metrics:** Track key performance indicators (KPIs):
    *   `workflow_success_rate`
    *   `average_workflow_duration`
    *   `llm_cost_per_workflow`
*   **Visualization:** Connect OpenTelemetry to **Grafana** + **Prometheus** (or Jaeger) for dashboards.

## 10. Documentation

*   **Developer Docs:** Technical architecture, setup guide, and contribution guidelines (`CONTRIBUTING.md`).
*   **API Reference:** Hosted Swagger UI.
*   **User Guide:** "How to Prompt" guide for getting the best results from Broski Agents.
*   **Architecture Decision Records (ADRs):** Document *why* specific technologies (like Drizzle or Fastify) were chosen.

---

### Implementation Phases

1.  **Phase 1 (Foundation):** Dockerize current CLI, add SQLite, and basic Logging.
2.  **Phase 2 (API & Core):** Extract core logic, build API, implement Parallel execution.
3.  **Phase 3 (Frontend & Ops):** Build React Dashboard, CI/CD, and production hardening.
