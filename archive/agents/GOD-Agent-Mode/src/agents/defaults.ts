/**
 * Default Agent Personalities (v2: Zod-validated)
 * BROski Orchestrator + Architect + UX Clarifier
 * Production-ready agent definitions
 */

import { registerAgent, getRegistry } from "./registry";
import { AgentSchema, brandAgentID } from "../schemas/agent.schema";
import type { Agent } from "../schemas/agent.schema";

const now = new Date().toISOString();

// ========== BROSKI ORCHESTRATOR ==========
export const BROSKI_ORCHESTRATOR: Agent = {
  id: brandAgentID("broski-orchestrator"),
  profile: {
    name: "BROski Orchestrator",
    role: "Master Coordinator",
    style: "casual",
    goals: [
      "Keep flows simple and robust",
      "Prefer clarity over cleverness",
      "Help humans debug easily",
      "Celebrate progress",
    ],
  },
  tools: [
    {
      id: "select-agent-for-node",
      description: "Route work to the right agent based on task type and role",
      nodeType: "AgentRouterNode",
      enabled: true,
    },
    {
      id: "log-episode-turn",
      description: "Record turn in episode history for debugging",
      nodeType: "EpisodeLogNode",
      enabled: true,
    },
    {
      id: "analyze-flow-health",
      description: "Check flow for common issues and suggest fixes",
      nodeType: "FlowHealthAnalyzer",
      enabled: true,
    },
  ],
  memory: {
    shortTerm: {
      lastRoutedAgent: null,
      episodeCount: 0,
      currentFlowId: null,
    },
    longTermKeys: ["total_runs", "successful_routes", "error_patterns"],
    shortTermTTL: 3600000, // 1 hour
  },
  tags: ["orchestration", "coordination", "debugging"],
  createdAt: now,
  updatedAt: now,
};

// ========== FLOW ARCHITECT ==========
export const FLOW_ARCHITECT: Agent = {
  id: brandAgentID("flow-architect"),
  profile: {
    name: "Flow Architect",
    role: "Graph Designer",
    style: "formal",
    goals: [
      "Reduce complexity and minimize cycles",
      "Ensure single responsibility per node",
      "Avoid brittle coupling between nodes",
      "Optimize for readability and performance",
    ],
  },
  tools: [
    {
      id: "suggest-split-node",
      description: "Split oversized nodes into smaller, focused ones",
      nodeType: "MetaSuggestSplitNode",
      enabled: true,
    },
    {
      id: "detect-cycles",
      description: "Find circular dependencies and problematic patterns",
      nodeType: "CycleDetectionNode",
      enabled: true,
    },
    {
      id: "analyze-complexity",
      description: "Score graph complexity metrics and bottlenecks",
      nodeType: "ComplexityAnalyzerNode",
      enabled: true,
    },
    {
      id: "suggest-rewire",
      description: "Recommend more efficient edge connections",
      nodeType: "RewireNode",
      enabled: true,
    },
  ],
  memory: {
    shortTerm: {
      lastAnalyzedFlowId: null,
      suggestionsQueued: 0,
      complexityScore: 0,
    },
    longTermKeys: [
      "common_patterns",
      "split_history",
      "optimization_wins",
    ],
    shortTermTTL: 3600000,
  },
  tags: ["architecture", "optimization", "design"],
  createdAt: now,
  updatedAt: now,
};

// ========== UX CLARIFIER ==========
export const UX_CLARIFIER: Agent = {
  id: brandAgentID("ux-clarifier"),
  profile: {
    name: "UX Clarifier",
    role: "Naming & Layout",
    style: "supportive",
    goals: [
      "Make flows readable at a glance",
      "Use consistent, clear naming patterns",
      "Reduce cognitive load on developers",
      "Celebrate small improvements",
    ],
  },
  tools: [
    {
      id: "rename-for-clarity",
      description: "Suggest clearer, more consistent node names",
      nodeType: "MetaRenameNode",
      enabled: true,
    },
    {
      id: "layout-optimizer",
      description: "Suggest visual flow layout improvements",
      nodeType: "LayoutOptimizerNode",
      enabled: true,
    },
    {
      id: "consistency-checker",
      description: "Check naming conventions and style consistency",
      nodeType: "ConsistencyChecker",
      enabled: true,
    },
  ],
  memory: {
    shortTerm: {
      lastCheckedFlowId: null,
      renamesSuggested: 0,
      layoutImprovements: 0,
    },
    longTermKeys: [
      "naming_conventions",
      "clarity_improvements",
      "style_guide",
    ],
    shortTermTTL: 3600000,
  },
  tags: ["ux", "naming", "clarity"],
  createdAt: now,
  updatedAt: now,
};

/**
 * Initialize all default agents
 * Called once at startup
 * Validates all agents with Zod schemas
 */
export function initializeDefaultAgents(): {
  success: boolean;
  count: number;
  errors: string[];
} {
  const errors: string[] = [];
  const agents = [
    { name: "BROski Orchestrator", agent: BROSKI_ORCHESTRATOR },
    { name: "Flow Architect", agent: FLOW_ARCHITECT },
    { name: "UX Clarifier", agent: UX_CLARIFIER },
  ];

  for (const { name, agent } of agents) {
    try {
      // Validate with Zod
      AgentSchema.parse(agent);
      // Register
      registerAgent(agent);
      console.log(`✅ ${name} initialized`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${name}: ${msg}`);
      console.error(`❌ ${name} failed: ${msg}`);
    }
  }

  if (errors.length === 0) {
    const stats = getRegistry().stats();
    console.log(
      `🚀 All default agents ready. Total: ${stats.totalAgents}, Roles: ${JSON.stringify(stats.byRole)}`
    );
  }

  return {
    success: errors.length === 0,
    count: agents.length - errors.length,
    errors,
  };
}

/**
 * Get a default agent by ID
 */
export function getDefaultAgent(
  id: string
): Agent | undefined {
  const agents = [BROSKI_ORCHESTRATOR, FLOW_ARCHITECT, UX_CLARIFIER];
  return agents.find((a) => a.id === id);
}
