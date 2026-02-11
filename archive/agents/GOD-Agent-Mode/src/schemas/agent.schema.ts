/**
 * Agent Validation Schemas (Zod)
 * Type-safe agent creation, registry operations, and memory management
 */

import { z } from "zod";

// ========== AGENT ID ==========
export const AgentIDSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "AgentID must be lowercase alphanumeric + hyphens")
  .brand<"AgentID">();

export type AgentID = z.infer<typeof AgentIDSchema>;

export function brandAgentID(id: string): AgentID {
  return AgentIDSchema.parse(id) as AgentID;
}

// ========== MEMORY ==========
export const AgentMemorySchema = z.object({
  shortTerm: z.record(z.string(), z.unknown()).default({}),
  longTermKeys: z.array(z.string()).default([]),
  shortTermTTL: z.number().positive().default(3600000), // 1 hour default
});

export type AgentMemory = z.infer<typeof AgentMemorySchema>;

// ========== PROFILE ==========
export const AgentProfileSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum([
    "Master Coordinator",
    "Graph Designer",
    "Naming & Layout",
    "Data Cleaner",
    "Custom",
  ]),
  style: z.enum(["casual", "formal", "supportive"]).default("casual"),
  goals: z.array(z.string().min(5)).min(1).max(10),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

// ========== TOOL ==========
export const AgentToolSchema = z.object({
  id: z.string().min(2).max(64),
  description: z.string().min(10).max(500),
  nodeType: z.string().min(2).max(64),
  enabled: z.boolean().default(true),
});

export type AgentTool = z.infer<typeof AgentToolSchema>;

// ========== AGENT (Full) ==========
export const AgentSchema = z.object({
  id: AgentIDSchema,
  profile: AgentProfileSchema,
  tools: z.array(AgentToolSchema).min(1),
  memory: AgentMemorySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()).default([]),
});

export type Agent = z.infer<typeof AgentSchema>;

// ========== AGENT CREATION INPUT ==========
export const CreateAgentInputSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: AgentIDSchema,
});

export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

// ========== REGISTRY OPERATIONS ==========
export const RegisterAgentSchema = CreateAgentInputSchema;
export const GetAgentSchema = z.object({
  id: AgentIDSchema,
});

export const ListAgentsByRoleSchema = z.object({
  role: AgentProfileSchema.shape.role,
});

// ========== SAFE PARSE HELPERS ==========
export function parseAgent(data: unknown): Agent {
  return AgentSchema.parse(data);
}

export function parseCreateAgentInput(data: unknown): CreateAgentInput {
  return CreateAgentInputSchema.parse(data);
}

export function parseAgentID(id: unknown): AgentID {
  return AgentIDSchema.parse(id);
}

export function validateAgent(data: unknown): {
  valid: boolean;
  data?: Agent;
  error?: string;
} {
  try {
    return { valid: true, data: AgentSchema.parse(data) };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof z.ZodError ? error.message : String(error),
    };
  }
}
