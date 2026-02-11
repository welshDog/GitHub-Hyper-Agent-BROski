/**
 * AgentRouter Node (v2: Deterministic, strategy-driven)
 * Routes work to agents based on configurable strategies
 * Supports: by_role, least_recently_used, round_robin, by_availability
 */

import { listAgents, listAgentsByRole, getLRUAgent, recordAgentUsage } from "../agents/registry";
import type { Agent, AgentID } from "../schemas/agent.schema";
import type { AgentRouterConfig, RouterOutput } from "../schemas/router.schema";
import {
  AgentRouterConfigSchema,
  RouterOutputSchema,
  DEFAULT_ROUTER_CONFIG,
} from "../schemas/router.schema";

/**
 * Main execution function for AgentRouter
 */
export async function executeAgentRouter(
  input: unknown,
  configData: unknown
): Promise<RouterOutput> {
  const startTime = new Date();

  // Validate config
  const config = AgentRouterConfigSchema.parse(configData);

  let selectedAgent: Agent | undefined;
  let reason = "";
  let confidence = 0.8;

  switch (config.strategy) {
    case "by_role":
      [selectedAgent, reason, confidence] = selectByRole(config);
      break;

    case "least_recently_used":
      [selectedAgent, reason, confidence] = selectLRU();
      break;

    case "round_robin":
      [selectedAgent, reason, confidence] = selectRoundRobin();
      break;

    case "by_availability":
      [selectedAgent, reason, confidence] = selectByAvailability(config);
      break;

    case "random":
      if (!config.allowRandom) {
        console.warn("Random strategy disabled, falling back to by_role");
        [selectedAgent, reason, confidence] = selectByRole({
          ...config,
          strategy: "by_role",
        });
      } else {
        [selectedAgent, reason, confidence] = selectRandom();
      }
      break;

    default:
      [selectedAgent, reason, confidence] = selectByRole(DEFAULT_ROUTER_CONFIG);
  }

  // Fallback to first available
  if (!selectedAgent) {
    const agents = listAgents();
    if (agents.length === 0) {
      throw new Error(
        "No agents available in registry. Initialize with initializeDefaultAgents()."
      );
    }
    selectedAgent = agents[0];
    reason = "Fallback to first available agent (no matches for strategy)";
    confidence = 0.5;
  }

  // Record usage
  recordAgentUsage(selectedAgent.id);

  // Track routing history
  if (config.trackRoutingHistory) {
    console.log(
      `[AgentRouter] ${selectedAgent.profile.name} selected for: ${reason}`
    );
  }

  // Parse output with Zod
  const output = RouterOutputSchema.parse({
    agentId: selectedAgent.id,
    agentName: selectedAgent.profile.name,
    strategy: config.strategy,
    reason,
    input,
    confidence,
    timestamp: new Date().toISOString(),
  });

  return output;
}

/**
 * Strategy: By Role
 * Selects first agent matching preferred roles
 */
function selectByRole(
  config: AgentRouterConfig
): [Agent | undefined, string, number] {
  if (!config.preferredRoles || config.preferredRoles.length === 0) {
    return [undefined, "No preferred roles configured", 0.3];
  }

  for (const role of config.preferredRoles) {
    const agents = listAgentsByRole(role);
    if (agents.length > 0) {
      return [
        agents[0],
        `First agent with role: ${role}`,
        0.95,
      ];
    }
  }

  return [undefined, `No agents found with roles: ${config.preferredRoles.join(", ")}`, 0.2];
}

/**
 * Strategy: Least Recently Used
 * Fair distribution across agents
 */
function selectLRU(): [Agent | undefined, string, number] {
  const agent = getLRUAgent();
  if (!agent) {
    return [undefined, "No agents available", 0.0];
  }

  return [
    agent,
    `Least recently used agent: ${agent.profile.name}`,
    0.9,
  ];
}

/**
 * Strategy: Round Robin
 * Deterministic cycling through agents
 */
function selectRoundRobin(): [Agent | undefined, string, number] {
  const agents = listAgents();
  if (agents.length === 0) {
    return [undefined, "No agents available", 0.0];
  }

  // Use LRU as deterministic selector
  const agent = getLRUAgent() || agents[0];
  return [
    agent,
    `Round robin selection: ${agent.profile.name}`,
    0.85,
  ];
}

/**
 * Strategy: By Availability
 * Selects agent with smallest memory footprint
 */
function selectByAvailability(
  config: AgentRouterConfig
): [Agent | undefined, string, number] {
  const agents = listAgents();
  if (agents.length === 0) {
    return [undefined, "No agents available", 0.0];
  }

  // Sort by short-term memory usage
  const sorted = agents.sort((a, b) => {
    const aUsage = Object.keys(a.memory.shortTerm).length;
    const bUsage = Object.keys(b.memory.shortTerm).length;
    return aUsage - bUsage;
  });

  const selected = sorted[0];
  const memoryLoad = Object.keys(selected.memory.shortTerm).length;

  // Check max concurrent limit
  if (config.maxConcurrentPerAgent && memoryLoad >= config.maxConcurrentPerAgent) {
    // Try next agent
    if (sorted.length > 1) {
      const alternate = sorted[1];
      return [
        alternate,
        `Primary agent at capacity, using ${alternate.profile.name}`,
        0.7,
      ];
    }
  }

  return [
    selected,
    `Selected by availability (memory: ${memoryLoad})`,
    0.8,
  ];
}

/**
 * Strategy: Random
 * Purely random selection (use with caution)
 * Only if explicitly enabled
 */
function selectRandom(): [Agent | undefined, string, number] {
  const agents = listAgents();
  if (agents.length === 0) {
    return [undefined, "No agents available", 0.0];
  }

  const agent = agents[Math.floor(Math.random() * agents.length)];
  return [
    agent,
    `Random selection (not recommended for production)`,
    0.5,
  ];
}

/**
 * Helper: Create default router config
 */
export function createRouterConfig(
  overrides?: Partial<AgentRouterConfig>
): AgentRouterConfig {
  return {
    ...DEFAULT_ROUTER_CONFIG,
    ...overrides,
  };
}
