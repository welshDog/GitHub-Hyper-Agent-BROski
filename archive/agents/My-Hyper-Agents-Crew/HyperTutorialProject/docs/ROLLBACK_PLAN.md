# Hyper-Upgrade Rollback Plan

This document defines the procedures for rolling back changes introduced during the Hyper-Upgrade phases.

## General Rollback Strategy

**Principle:** "Fast Revert, Deep Investigation."
If a production incident occurs within 1 hour of deployment, assume the deployment is the cause and revert immediately.

### Phase 1: Foundation (Docker/SQLite)

*   **Trigger:** Docker container fails to start, or SQLite database is corrupted.
*   **Action:**
    1.  Stop running containers: `docker-compose down`.
    2.  Revert to CLI mode: `npm run power-moves` directly on host.
    3.  Restore `src/config.ts` from backup if environment variables were modified.

### Phase 2: API & Core (Fastify/Parallel Execution)

*   **Trigger:** API error rate > 1% or Agent Orchestration logic fails (e.g., deadlock in parallel tasks).
*   **Action:**
    1.  Switch traffic back to the stable CLI version (if possible) or previous Docker image tag.
    2.  **Code Revert:** Checkout the `main` branch tag prior to the API merge.
    3.  **Data:** If database schema migrations failed, run the `down` migration scripts (e.g., `prisma migrate resolve`).

### Phase 3: Frontend & Ops

*   **Trigger:** Dashboard is inaccessible or CI/CD pipeline blocks critical hotfixes.
*   **Action:**
    1.  **Frontend:** Revert the S3/Vercel deployment to the previous commit hash.
    2.  **CI/CD:** Disable the failing GitHub Action workflow manually.
    3.  **Manual Deployment:** Use the manual build script `scripts/deploy_manual.sh` to bypass the broken pipeline.

## Verification Checklist (Post-Rollback)

1.  **Functionality:** Run `npm test` to ensure the core logic passes.
2.  **Connectivity:** Verify the CLI can still make outbound calls to OpenAI.
3.  **Data Integrity:** Check that no critical data was lost during the schema revert.

## Contact

*   **System Owner:** DevOps Team / Lead Architect
*   **Emergency Channel:** `#ops-emergency`
