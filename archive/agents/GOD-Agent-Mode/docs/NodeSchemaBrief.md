# Hyperflow Node Schema — Architect Brief

## Mission
- Define a robust, neurodivergent‑friendly Node/Graph data contract that:
  - Supports ETL, Generative, and Hybrid pipelines
  - Enables clear visualization, low cognitive load, and fast iteration
  - Guarantees safe execution and schema‑validated persistence

## Scope
- Nodes (Input/Processor/Output/Composite)
- Ports (typed I/O) with explicit handles
- Edges (source/target + handle mapping)
- Graph metadata (id, version)
- Execution contract (engine ↔ node runtime)
- Validation (Zod), error semantics, versioning, and serialization
 - Cross-reference validation (edges reference actual ports)

## Use Cases
- ETL: parse → transform → validate → export (CSV/JSON/DB)
- Generative: prompt → generate → post‑process → curate
- Hybrid: ingest → enrich (LLM/tools) → route → deliver

## Data Model
- Node
  - id: string
  - type: string ("input" | "processor" | "output" | custom)
  - position: { x: number, y: number }
  - data:
    - label: string
    - config: Record<string, unknown>
    - code?: string
  - inputs: Port[]
  - outputs: Port[]
- Port
  - id: string
  - label: string
  - type: "string" | "number" | "boolean" | "json" | "flow"
- Edge
  - id: string
  - source: node.id
  - sourceHandle: port.id
  - target: node.id
  - targetHandle: port.id
- Graph
  - id: string
  - version: string (e.g., semver)
  - nodes: HyperNode[]
  - edges: Edge[]
  - validation: cross-references checked for node/port existence

## Validation (Zod)
- Enforce structural integrity and type constraints with Zod schemas
- Non‑UUID string ids to reduce friction in authoring
- Required handle mapping: edges must reference existing ports
- Backward compatibility: tolerate missing handles with defaults, but warn
 - Cross-reference validator reports invalid edges at design-time and run-time

## Execution Contract
- Engine passes ExecutionContext to NodeExecutor
  - graph: HyperGraph
  - nodeId: string
  - inputs: Record<string, PortValue>
  - log: (msg: string) => void
- NodeExecutor returns Record<string, PortValue>
- Engine maps outputs to edges via sourceHandle, and inputs via targetHandle

## Events & Error Semantics
- Node execution events: start, success, error, duration
- Error: include nodeId, type, message, input snapshot
- Recovery: continue, skip, retry policies

## Versioning & Migration
- Graph.version increments on breaking schema changes
- Migration rules:
  - id/handle normalization
  - type coercion for json payloads
  - unknown fields preserved under meta

## Serialization
- JSON with Zod validation on load and before run
- Stable ordering for nodes/edges to reduce diff noise

## Performance Budgets
- Interaction ≤ 100ms
- Execution overhead ≤ 2ms per node mapping
- Validation ≤ 10ms for 100 nodes

## Accessibility & UX
- ARIA labels for controls
- Keyboard navigation: selection, create, delete, move
- Snap‑to‑grid and alignment guides reduce spatial cognitive load

## References
- Schema: [schema.ts](file:///c:/Users/lyndz/Documents/trae_projects/Gods%20Agents%20Mode/src/core/schema.ts)
- Engine: [engine.ts](file:///c:/Users/lyndz/Documents/trae_projects/Gods%20Agents%20Mode/src/core/engine.ts)
- Canvas: [Canvas.tsx](file:///c:/Users/lyndz/Documents/trae_projects/Gods%20Agents%20Mode/components/Canvas.tsx)

## Open Questions for Architect
- Composite nodes: nested graphs, port exposure strategy
- Typed flows: should "flow" type carry metadata (rate, provenance)?
- Determinism: hashing of node config to cache outputs?
- Multi‑edge policies: fan‑out order and backpressure

## Acceptance Criteria
- Zod schemas enforce integrity and are documented
- Engine routing respects port handles with fallbacks
- Import/Export validated and migrates older graphs
- Tests ≥ 90% coverage for mapping, validation, and execution glue
