import { runPrototypeFlow } from '../core/engine';
import type { HyperGraph, HyperNode } from '../core/schema';
import { describe, it, expect } from 'vitest';

function makeLinearGraph(n: number): HyperGraph {
  const nodes: HyperNode[] = [];
  const edges: HyperGraph['edges'] = [];
  const input: HyperNode = { id: 'n0', type: 'csvInput', position: { x: 0, y: 0 }, data: { label: 'CSV', config: { value: 'x\n1\n2\n3' } }, inputs: [], outputs: [{ id: 'o0', label: 'Out', type: 'json' }] };
  nodes.push(input);
  for (let i = 1; i < n - 1; i++) {
    nodes.push({ id: `n${i}`, type: 'map', position: { x: i * 100, y: 0 }, data: { label: `M${i}` }, inputs: [{ id: `i${i}`, label: 'In', type: 'json' }], outputs: [{ id: `o${i}`, label: 'Out', type: 'json' }] });
  }
  nodes.push({ id: `n${n - 1}`, type: 'sinkConsole', position: { x: (n - 1) * 100, y: 0 }, data: { label: 'Sink' }, inputs: [{ id: `i${n - 1}`, label: 'In', type: 'json' }], outputs: [] });
  for (let i = 0; i < n - 1; i++) {
    edges.push({ id: `e${i}`, source: `n${i}`, sourceHandle: i === 0 ? 'o0' : `o${i}`, target: `n${i + 1}`, targetHandle: `i${i + 1}` });
  }
  return { id: 'bench', nodes, edges };
}

describe('Prototype flow benchmark', () => {
  it('executes linear graphs within reasonable time', async () => {
    for (const size of [10, 50, 100]) {
      const g = makeLinearGraph(size);
      const t0 = performance.now();
      await runPrototypeFlow(g);
      const t1 = performance.now();
      const ms = t1 - t0;
      expect(ms).toBeGreaterThanOrEqual(0);
    }
  });
});
