import type { HyperGraph, HyperNode } from './schema';

export function validateGraphReferences(graph: HyperGraph): string[] {
  const errors: string[] = [];
  const nodeById: Record<string, HyperNode> = {};
  for (const n of graph.nodes) nodeById[n.id] = n;

  for (const e of graph.edges) {
    const src = nodeById[e.source];
    const tgt = nodeById[e.target];
    if (!src) errors.push(`Edge ${e.id}: source node '${e.source}' not found`);
    if (!tgt) errors.push(`Edge ${e.id}: target node '${e.target}' not found`);
    if (src) {
      const ok = src.outputs.some((p) => p.id === e.sourceHandle);
      if (!ok) errors.push(`Edge ${e.id}: sourceHandle '${e.sourceHandle}' not found in node '${src.id}' outputs`);
    }
    if (tgt) {
      const ok = tgt.inputs.some((p) => p.id === e.targetHandle);
      if (!ok) errors.push(`Edge ${e.id}: targetHandle '${e.targetHandle}' not found in node '${tgt.id}' inputs`);
    }
  }
  return errors;
}
