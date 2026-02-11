  import { z } from 'zod';

// ==========================================
// 🧠 The HyperNode Schema (Genesis               )
// ==========================================

// -- 1. Data Types --
// What can flow through the pipes?
export const HyperTypeSchema = z.enum(['string', 'number', 'boolean', 'json', 'flow']);
export type HyperType = z.infer<typeof HyperTypeSchema>;

// -- 2. Port Definition --
// Input/Output sockets
export const PortSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  type: HyperTypeSchema,
});
export type Port = z.infer<typeof PortSchema>;

// -- 3. Node Data --
// The brain of the node
export const NodeDataSchema = z.object({
  label: z.string(),
  // Configuration for the node's internal logic
  config: z.record(z.string(), z.unknown()).optional(),
  // Optional: Raw HyperCode for custom logic nodes
  code: z.string().optional(),
});
export type NodeData = z.infer<typeof NodeDataSchema>;

// -- 4. The HyperNode --
// The atom of the graph
export const HyperNodeSchema = z.object({
  id: z.string(),
  type: z.string(), // e.g., 'processor', 'input', 'output'
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: NodeDataSchema,
  inputs: z.array(PortSchema),
  outputs: z.array(PortSchema),
});
export type HyperNode = z.infer<typeof HyperNodeSchema>;

// -- 5. The HyperGraph --
// The complete system state
export const HyperGraphSchema = z.object({
  id: z.string(),
  nodes: z.array(HyperNodeSchema),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(), // Node ID
    sourceHandle: z.string(), // Port ID
    target: z.string(), // Node ID
    targetHandle: z.string(), // Port ID
  })),
});
export type HyperGraph = z.infer<typeof HyperGraphSchema>;

export interface CorePort {
  id: string;
  label: string;
  type: HyperType;
}

export interface CoreNodeData {
  label: string;
  config?: Record<string, unknown>;
  code?: string;
}

export interface CoreEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface CoreNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CoreNodeData;
  inputs: CorePort[];
  outputs: CorePort[];
}

export interface CoreGraph {
  id: string;
  nodes: CoreNode[];
  edges: CoreEdge[];
}
