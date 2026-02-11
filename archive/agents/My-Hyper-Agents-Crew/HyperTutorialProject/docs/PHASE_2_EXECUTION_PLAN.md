# Phase 2 Execution Plan: API & Core Architecture

## 1. Objectives & Deliverables
**Goal:** Transform the CLI tool into a scalable, persistent Agent Platform.

*   **Objective 1:** **Persistence.** Store agent history, profiles, and logs in a structured database.
*   **Objective 2:** **Observability.** Replace console logs with structured JSON logging for better debugging and analysis.
*   **Objective 3:** **Concurrency.** Enable parallel agent execution via an API server.

**Deliverables:**
1.  **Fastify Server:** REST API exposing agent capabilities.
2.  **SQLite Database:** Persistent storage managed by Drizzle ORM.
3.  **Structured Logging:** Pino logger integration.
4.  **Updated CLI:** Refactored to consume the new API.

## 2. Timeline & Milestones

| Milestone | ID | Description | Est. Time |
| :--- | :--- | :--- | :--- |
| **Foundation** | **2.1** | Install Fastify, Drizzle, SQLite. Setup DB schema & connection. | 1 Day |
| **API Layer** | **2.2** | Create `/agent` endpoints. Port `BroskiOrchestrator` to service. | 2 Days |
| **Async Engine**| **2.3** | Implement BullMQ for background task processing. | 2 Days |
| **Integration** | **2.4** | Update CLI to call API. E2E Testing. | 1 Day |

## 3. Technical Specifications

### 3.1 Server Stack
*   **Framework:** **Fastify** (v5). Chosen for low overhead and schema-based validation.
*   **Logging:** **Pino**. Native integration with Fastify, high performance.
*   **Validation:** **Zod**. Shared schemas between Frontend/CLI and Backend.

### 3.2 Database Strategy
*   **Engine:** **SQLite** (via `better-sqlite3`). Zero-config, file-based, perfect for this scale. Upgradeable to PostgreSQL later.
*   **ORM:** **Drizzle**. TypeScript-first, lightweight, no code generation step required at runtime.
*   **Schema:**
    *   `agents`: (id, name, type, version, status)
    *   `workflows`: (id, user_request, status, created_at)
    *   `tasks`: (id, workflow_id, agent_type, input, output, status)

### 3.3 Testing & QA
*   **Unit Tests:** Jest for new Services and Utils.
*   **Integration Tests:** `supertest` against Fastify endpoints.
*   **Criteria:** 100% Type Coverage, >80% Code Coverage.

## 4. Risk Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Data Loss** | Medium | SQLite file backup on shutdown. WAL mode enabled. |
| **API Latency** | High | Async processing for LLM calls (BullMQ). 5s timeout on sync endpoints. |
| **Breaking Changes** | High | Versioned API (`/api/v1`). Keep CLI logic until API is stable. |

## 5. Stakeholders & Communication
*   **Lead Developer:** (You)
*   **Reviewer:** (User)
*   **Update Frequency:** Per Milestone completion.

## 6. KPIs (Success Metrics)
*   ✅ **Persistence:** Agent memory survives server restart.
*   ✅ **Performance:** API response < 50ms (overhead).
*   ✅ **Reliability:** Zero unhandled exceptions in logs.
