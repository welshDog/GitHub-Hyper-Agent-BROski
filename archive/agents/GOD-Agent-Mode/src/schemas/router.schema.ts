/**
 * Router Configuration Schemas (Zod)
 * Type-safe agent routing strategies and decision-making
 */

import { z } from "zod";
import { AgentIDSchema } from "./agent.schema";

// ========== ROUTING STRATEGIES ==========
export const RoutingStrategySchema = z.enum([
  "by_role",
  "round_robin",
  "least_recently_used",
  "by_availability",
  "random",
]);

export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

// ========== AGENT ROLES ==========
export const AgentRoleSchema = z.enum([
  "Master Coordinator",
  "Graph Designer",
  "Naming & Layout",
  "Data Cleaner",
  "Custom",
]);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

// ========== ROUTER CONFIG ==========
export const AgentRouterConfigSchema = z.object({
  strategy: RoutingStrategySchema.default("by_role"),
  preferredRoles: z.array(AgentRoleSchema).optional(),
  fallbackAgentId: AgentIDSchema.optional(),
  allowRandom: z.boolean().default(false),
  trackRoutingHistory: z.boolean().default(true),
  maxConcurrentPerAgent: z.number().int().positive().default(5),
});

export type AgentRouterConfig = z.infer<typeof AgentRouterConfigSchema>;

// ========== ROUTER OUTPUT ==========
export const RouterOutputSchema = z.object({
  agentId: AgentIDSchema,
  agentName: z.string(),
  strategy: RoutingStrategySchema,
  reason: z.string(),
  input: z.unknown(),
  confidence: z.number().min(0).max(1).default(0.8),
  timestamp: z.string().datetime(),
});

export type RouterOutput = z.infer<typeof RouterOutputSchema>;

// ========== ROUTING DECISION CONTEXT ==========
export const RoutingDecisionSchema = z.object({
  id: z.string().min(1),
  flowId: z.string().min(1),
  selectedAgentId: AgentIDSchema,
  config: AgentRouterConfigSchema,
  availableAgents: z.array(AgentIDSchema),
  reason: z.string(),
  score: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

// ========== ROUTING HISTORY (for LRU and tracking) ==========
export const RoutingHistoryEntrySchema = z.object({
  agentId: AgentIDSchema,
  lastUsedAt: z.string().datetime(),
  useCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
});

export type RoutingHistoryEntry = z.infer<typeof RoutingHistoryEntrySchema>;

export const RoutingHistorySchema = z.map(AgentIDSchema, RoutingHistoryEntrySchema);
export type RoutingHistory = z.infer<typeof RoutingHistorySchema>;

// ========== SAFE PARSE HELPERS ==========
export function parseRouterConfig(data: unknown): AgentRouterConfig {
  return AgentRouterConfigSchema.parse(data);
}

export function parseRouterOutput(data: unknown): RouterOutput {
  return RouterOutputSchema.parse(data);
}

export function parseRoutingDecision(data: unknown): RoutingDecision {
  return RoutingDecisionSchema.parse(data);
}

export function validateRouterConfig(data: unknown): {
  valid: boolean;
  data?: AgentRouterConfig;
  error?: string;
} {
  try {
    return { valid: true, data: AgentRouterConfigSchema.parse(data) };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof z.ZodError ? error.message : String(error),
    };
  }
}

// ========== DEFAULTS ==========
export const DEFAULT_ROUTER_CONFIG: AgentRouterConfig = {
  strategy: "by_role",
  preferredRoles: ["Master Coordinator"],
  allowRandom: false,
  trackRoutingHistory: true,
  maxConcurrentPerAgent: 5,
};
