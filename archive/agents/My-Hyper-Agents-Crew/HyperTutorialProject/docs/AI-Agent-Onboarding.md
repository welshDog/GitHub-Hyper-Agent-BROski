# AI Agent Onboarding

## Quickstart
- Install: `npm ci`
- Validate: `npm run typecheck && npm run lint && npm test`
- Build: `npm run build`
- Discover schemas: `npm run schema:generate`
- Scaffold modules: `npm run scaffold`

## Interfaces
- Config schema: dist/schema/app-config.json
- Exports: dist/index.js
- Telemetry: start src/telemetry.ts in dev or load dist/telemetry.js in prod

## CI Signals
- Coverage uploaded as artifact named `coverage`
- CodeQL runs on pushes and PRs to main
