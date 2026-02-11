/**
 * GOD Agent Mode v2
 * Hyperflow Agents Orchestrator
 * Neurodivergent-first, personality-driven, turn-based execution
 */

// ========== SCHEMAS (Validation) ==========
export * from "./schemas/agent.schema";
export * from "./schemas/episode.schema";
export * from "./schemas/router.schema";

// ========== AGENTS ==========
export * from "./agents/registry";
export {
  BROSKI_ORCHESTRATOR,
  FLOW_ARCHITECT,
  UX_CLARIFIER,
  initializeDefaultAgents,
  getDefaultAgent,
} from "./agents/defaults";

// ========== RUNTIME ==========
export * from "./runtime/episodes";
export { executeAgentRouter, createRouterConfig } from "./nodes/AgentRouterNode";

// ========== META LAYER ==========
export { analyzeSplits, getDetailedSplitPlan, detectPatterns } from "./meta/suggestSplitNode";
export { analyzeClarityy, getNamingStats, applyRename } from "./meta/renameNode";

// ========== VERSION ==========
export const VERSION = "0.2.0";
export const ORCHESTRATOR_NAME = "GOD Agent Mode";

/**
 * Initialize GOD Agent Mode Orchestrator
 * Call this once at startup
 */
import { initializeDefaultAgents } from "./agents/defaults";
export function initOrchestrator(config?: { persistenceEnabled?: boolean }): {
  success: boolean;
  version: string;
  agentsLoaded: number;
  errors: string[];
} {
  console.log(`🚀 Initializing ${ORCHESTRATOR_NAME} v${VERSION}...`);

  // Initialize default agents
  const agentInit = initializeDefaultAgents();

  if (agentInit.success) {
    console.log(
      `✅ Orchestrator ready: ${agentInit.count} default agents loaded`
    );
  } else {
    console.error(`❌ Orchestrator initialization had errors:`, agentInit.errors);
  }

  return {
    success: agentInit.success,
    version: VERSION,
    agentsLoaded: agentInit.count,
    errors: agentInit.errors,
  };
}

/**
 * Quick health check
 */
export function getOrchestratorStatus(): {
  healthy: boolean;
  agents: number;
  episodes: ReturnType<typeof getEpisodeStats>;
} {
  const { getRegistryStats } = require("./agents/registry");
  const { getEpisodeStats: getEpisodeStatsFunc } = require("./runtime/episodes");

  const registryStats = getRegistryStats();
  const episodeStats = getEpisodeStatsFunc();

  return {
    healthy: registryStats.totalAgents > 0,
    agents: registryStats.totalAgents,
    episodes: episodeStats,
  };
}

import { getEpisodeStats } from "./runtime/episodes";
