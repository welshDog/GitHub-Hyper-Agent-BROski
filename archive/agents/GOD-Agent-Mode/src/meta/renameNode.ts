/**
 * Meta Node: UX Clarifier's Rename Suggestions
 * Improves node names for readability and consistency
 */

import type { Flow, FlowNode, MetaSuggestion, RenameSuggestion } from "../schemas/episode.schema";
import type { AgentID } from "../schemas/agent.schema";

export interface ClarityAnalysisConfig {
  maxNameLength: number;
  flowId: string;
  agentId: AgentID;
  minConfidence?: number; // 0-1, default 0.7
}

// Anti-patterns (generic, unclear names)
const AVOID_PATTERNS = [
  { regex: /^(do|handle|process|run|execute|call)_/i, reason: "Generic action verb" },
  { regex: /^(stuff|data|thing|misc|temp|tmp|test)$/i, reason: "Non-descriptive name" },
  { regex: /^[a-z0-9]$/i, reason: "Single character name" },
  { regex: /^([a-z])([a-z])\d{1,3}$/i, reason: "Cryptic abbreviation" },
];

// Name patterns to prefer
const PREFER_PATTERNS = [
  { regex: /parse/i, suggestion: "Parse", category: "data-processing" },
  { regex: /validate|check|verify/i, suggestion: "Validate", category: "quality" },
  { regex: /transform|convert/i, suggestion: "Transform", category: "data-processing" },
  { regex: /filter|select|sort/i, suggestion: "Filter", category: "data-processing" },
  { regex: /aggregate|summarize|collect/i, suggestion: "Aggregate", category: "analytics" },
  { regex: /fetch|retrieve|query|get/i, suggestion: "Fetch", category: "io" },
  { regex: /send|post|write|save/i, suggestion: "Send", category: "io" },
];

/**
 * Analyze flow for naming clarity
 */
export function analyzeClarityy(
  flow: Flow,
  config: ClarityAnalysisConfig
): MetaSuggestion[] {
  const suggestions: MetaSuggestion[] = [];
  const minConf = config.minConfidence ?? 0.7;

  for (const node of flow.nodes) {
    const recommendation = getNameRecommendation(node, config, minConf);
    if (recommendation) {
      suggestions.push({
        id: `rename-${node.id}-${Date.now()}`,
        type: "rename",
        flowId: config.flowId,
        agentId: config.agentId,
        severity: recommendation.confidence > 0.85 ? "warning" : "info",
        payload: recommendation,
      });
    }
  }

  return suggestions;
}

/**
 * Get rename recommendation for single node
 */
function getNameRecommendation(
  node: FlowNode,
  config: ClarityAnalysisConfig,
  minConfidence: number
): RenameSuggestion | null {
  const checks = [
    checkLength(node, config.maxNameLength),
    checkAntiPatterns(node),
    checkPreferredPatterns(node),
  ];

  // Return first recommendation with confidence >= minConfidence
  for (const check of checks) {
    if (check && check.confidence >= minConfidence) {
      return check;
    }
  }

  return null;
}

/**
 * Check: Name too long
 */
function checkLength(
  node: FlowNode,
  maxLength: number
): RenameSuggestion | null {
  if (node.name.length > maxLength) {
    return {
      nodeId: node.id,
      oldName: node.name,
      newName: node.name.slice(0, maxLength - 3) + "...",
      rationale: `Name exceeds ${maxLength} chars. Harder to scan in graph view.`,
      confidence: 0.8,
    };
  }
  return null;
}

/**
 * Check: Generic/unclear naming
 */
function checkAntiPatterns(node: FlowNode): RenameSuggestion | null {
  for (const { regex, reason } of AVOID_PATTERNS) {
    if (regex.test(node.name)) {
      return {
        nodeId: node.id,
        oldName: node.name,
        newName: `[Improve to action + target, e.g., "ParseUserInput"]`,
        rationale: `${reason}: "${node.name}" is too generic. Use Verb + Noun format.`,
        confidence: 0.85,
      };
    }
  }
  return null;
}

/**
 * Check: Opportunity to use preferred pattern
 */
function checkPreferredPatterns(node: FlowNode): RenameSuggestion | null {
  for (const { regex, suggestion, category } of PREFER_PATTERNS) {
    if (regex.test(node.name)) {
      // Extract the noun/target
      const target = node.name
        .replace(regex, "")
        .replace(/[-_]/g, " ")
        .trim();

      if (target && target.length > 0) {
        const newName = `${suggestion}${target
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("")}`;

        // Only if different
        if (newName !== node.name) {
          return {
            nodeId: node.id,
            oldName: node.name,
            newName,
            rationale: `Standardize to "Verb + Target" format (${category})`,
            confidence: 0.9,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Get naming statistics for a flow
 */
export function getNamingStats(flow: Flow): {
  totalNodes: number;
  avgNameLength: number;
  problematicNames: number;
  suggestions: number;
} {
  let totalLength = 0;
  let problematic = 0;

  for (const node of flow.nodes) {
    totalLength += node.name.length;

    // Count problematic names
    const hasAntiPattern = AVOID_PATTERNS.some((p) => p.regex.test(node.name));
    const tooLong = node.name.length > 50;

    if (hasAntiPattern || tooLong) {
      problematic++;
    }
  }

  return {
    totalNodes: flow.nodes.length,
    avgNameLength: flow.nodes.length > 0 ? Math.round(totalLength / flow.nodes.length) : 0,
    problematicNames: problematic,
    suggestions: problematic, // 1 suggestion per problematic name
  };
}

/**
 * Apply rename suggestion to flow
 */
export function applyRename(
  flow: Flow,
  nodeId: string,
  newName: string
): Flow {
  const node = flow.nodes.find((n) => n.id === nodeId);
  if (node) {
    node.name = newName;
  }
  return flow;
}
