/**
 * Meta Node: Architect's Split Suggestions
 * Detects oversized nodes and suggests splitting strategy
 */

import type { Flow, FlowNode, MetaSuggestion, SplitSuggestion } from "../schemas/episode.schema";
import type { AgentID } from "../schemas/agent.schema";

export interface SplitAnalysisConfig {
  maxInputsPerNode: number;
  maxOutputsPerNode: number;
  flowId: string;
  agentId: AgentID;
  minComplexityGain?: number; // 0-1, minimum improvement to suggest
}

/**
 * Analyze flow and suggest node splits
 * Flow Architect's primary function
 */
export function analyzeSplits(
  flow: Flow,
  config: SplitAnalysisConfig
): MetaSuggestion[] {
  const suggestions: MetaSuggestion[] = [];

  for (const node of flow.nodes) {
    // Count inputs and outputs
    const inputCount = flow.edges.filter((e) => e.targetId === node.id).length;
    const outputCount = flow.edges.filter((e) => e.sourceId === node.id).length;

    // Check thresholds
    const inputsExceeded = inputCount > config.maxInputsPerNode;
    const outputsExceeded = outputCount > config.maxOutputsPerNode;

    if (inputsExceeded || outputsExceeded) {
      const reason = [
        inputsExceeded ? `${inputCount} inputs (max ${config.maxInputsPerNode})` : null,
        outputsExceeded ? `${outputCount} outputs (max ${config.maxOutputsPerNode})` : null,
      ]
        .filter(Boolean)
        .join(", ");

      // Calculate complexity reduction estimate
      const estimatedReduction = Math.min(
        (inputCount > 0 ? inputCount / (config.maxInputsPerNode * 3) : 0) +
          (outputCount > 0 ? outputCount / (config.maxOutputsPerNode * 3) : 0),
        0.95
      );

      // Only suggest if significant improvement
      if (
        !config.minComplexityGain ||
        estimatedReduction >= config.minComplexityGain
      ) {
        const splitSuggestion: SplitSuggestion = {
          nodeId: node.id,
          reason: `High complexity: ${reason}`,
          proposedNewNodes: [
            `${node.id}_preprocess`,
            `${node.id}_core`,
            `${node.id}_postprocess`,
          ],
          estimatedComplexityReduction: estimatedReduction,
        };

        suggestions.push({
          id: `split-${node.id}-${Date.now()}`,
          type: "split",
          flowId: config.flowId,
          agentId: config.agentId,
          severity:
            estimatedReduction > 0.7 ? "critical" :
            estimatedReduction > 0.4 ? "warning" : "info",
          payload: splitSuggestion,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Get detailed split plan for a node
 */
export function getDetailedSplitPlan(
  node: FlowNode,
  inputCount: number,
  outputCount: number
): {
  preprocess: string[];
  core: string[];
  postprocess: string[];
} {
  // Heuristic: distribute by complexity
  const totalConnections = inputCount + outputCount;
  const preprocessCount = Math.ceil(inputCount / 3) || 1;
  const postprocessCount = Math.ceil(outputCount / 3) || 1;

  return {
    preprocess: Array.from(
      { length: preprocessCount },
      (_, i) => `${node.id}_preprocess_${i + 1}`
    ),
    core: [`${node.id}_core`],
    postprocess: Array.from(
      { length: postprocessCount },
      (_, i) => `${node.id}_postprocess_${i + 1}`
    ),
  };
}

/**
 * Detect common problematic patterns
 */
export function detectPatterns(
  flow: Flow
): Array<{ pattern: string; nodeIds: string[]; severity: string }> {
  const patterns: Array<{ pattern: string; nodeIds: string[]; severity: string }> = [];

  // Pattern 1: Hub node (many connections)
  for (const node of flow.nodes) {
    const connCount =
      flow.edges.filter((e) => e.sourceId === node.id || e.targetId === node.id).length;
    if (connCount > 10) {
      patterns.push({
        pattern: "Hub node",
        nodeIds: [node.id],
        severity: "warning",
      });
    }
  }

  // Pattern 2: Circular dependency
  const visited = new Set<string>();
  const hasCycle = (nodeId: string, path: Set<string>): boolean => {
    if (path.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    path.add(nodeId);
    for (const edge of flow.edges.filter((e) => e.sourceId === nodeId)) {
      if (hasCycle(edge.targetId, path)) return true;
    }
    path.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  for (const node of flow.nodes) {
    visited.clear();
    if (hasCycle(node.id, new Set())) {
      patterns.push({
        pattern: "Circular dependency",
        nodeIds: [node.id],
        severity: "critical",
      });
    }
  }

  return patterns;
}
