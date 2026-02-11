/**
 * Episode & Flow Validation Schemas (Zod)
 * Type-safe episode creation, turn recording, and flow execution
 */

import { z } from "zod";
import { AgentIDSchema } from "./agent.schema";

// ========== IDs ==========
export const EpisodeIDSchema = z
  .string()
  .min(10)
  .regex(/^ep_/, "EpisodeID must start with 'ep_'")
  .brand<"EpisodeID">();
export type EpisodeID = z.infer<typeof EpisodeIDSchema>;

export const TurnIDSchema = z
  .string()
  .min(10)
  .regex(/^turn_/, "TurnID must start with 'turn_'")
  .brand<"TurnID">();
export type TurnID = z.infer<typeof TurnIDSchema>;

export function brandEpisodeID(id: string): EpisodeID {
  return EpisodeIDSchema.parse(id);
}

export function brandTurnID(id: string): TurnID {
  return TurnIDSchema.parse(id);
}

// ========== TURN ==========
export const EpisodeTurnSchema = z.object({
  id: TurnIDSchema,
  sequenceNumber: z.number().int().positive(),
  input: z.unknown(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  agentId: AgentIDSchema.optional(),
  nodeIds: z.array(z.string().min(1)).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
});

export type EpisodeTurn = z.infer<typeof EpisodeTurnSchema>;

// ========== EPISODE ==========
export const EpisodeStatusSchema = z.enum(["running", "completed", "failed", "paused"]);
export type EpisodeStatus = z.infer<typeof EpisodeStatusSchema>;

export const EpisodeSchema = z.object({
  id: EpisodeIDSchema,
  flowId: z.string().min(1),
  ownerAgentId: AgentIDSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  turns: z.array(EpisodeTurnSchema),
  status: EpisodeStatusSchema,
  totalDurationMs: z.number().nonnegative().default(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Episode = z.infer<typeof EpisodeSchema>;

// ========== FLOW NODE ==========
export const FlowNodeSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(64),
  config: z.record(z.string(), z.unknown()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export type FlowNode = z.infer<typeof FlowNodeSchema>;

// ========== FLOW EDGE ==========
export const FlowEdgeSchema = z.object({
  id: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().optional(),
});

export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

// ========== FLOW (Full Graph) ==========
export const FlowSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerAgentId: AgentIDSchema.optional(),
  nodes: z.array(FlowNodeSchema).min(1),
  edges: z.array(FlowEdgeSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Flow = z.infer<typeof FlowSchema>;

// ========== CORE GRAPH (unified data + meta) ==========
export const CoreGraphSchema = z.object({
  flow: FlowSchema,
  episodes: z.array(EpisodeSchema).default([]),
  suggestions: z.array(z.object({ id: z.string(), type: z.string() })).default([]),
});

export type CoreGraph = z.infer<typeof CoreGraphSchema>;

// ========== META SUGGESTIONS ==========
export const SplitSuggestionSchema = z.object({
  nodeId: z.string().min(1),
  reason: z.string().min(1),
  proposedNewNodes: z.array(z.string().min(1)).min(1),
  estimatedComplexityReduction: z.number().min(0).max(1),
});
export type SplitSuggestion = z.infer<typeof SplitSuggestionSchema>;

export const RenameSuggestionSchema = z.object({
  nodeId: z.string().min(1),
  oldName: z.string().min(1),
  newName: z.string().min(1),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type RenameSuggestion = z.infer<typeof RenameSuggestionSchema>;

export const MetaSuggestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["split", "rename", "rewire", "remove", "add"]),
  flowId: z.string().min(1),
  agentId: AgentIDSchema,
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  payload: z.union([SplitSuggestionSchema, RenameSuggestionSchema, z.unknown()]),
});
export type MetaSuggestion = z.infer<typeof MetaSuggestionSchema>;

// ========== SAFE PARSE HELPERS ==========
export function parseEpisode(data: unknown): Episode {
  return EpisodeSchema.parse(data);
}

export function parseFlow(data: unknown): Flow {
  return FlowSchema.parse(data);
}

export function parseEpisodeTurn(data: unknown): EpisodeTurn {
  return EpisodeTurnSchema.parse(data);
}

export function validateFlow(data: unknown): {
  valid: boolean;
  data?: Flow;
  error?: string;
} {
  try {
    return { valid: true, data: FlowSchema.parse(data) };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof z.ZodError ? error.message : String(error),
    };
  }
}

export function validateEpisode(data: unknown): {
  valid: boolean;
  data?: Episode;
  error?: string;
} {
  try {
    return { valid: true, data: EpisodeSchema.parse(data) };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof z.ZodError ? error.message : String(error),
    };
  }
}
