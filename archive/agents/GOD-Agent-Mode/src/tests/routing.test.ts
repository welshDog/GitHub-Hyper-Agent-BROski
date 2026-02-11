import type { HyperGraph, HyperNode } from '../core/schema';
import { executeNode } from '../core/engine';
import type { NodeIO } from '../core/engine';
import { describe, it, expect } from 'vitest';

describe('Routing Nodes', () => {
  it('branch, merge, and condition behave correctly', async () => {
    const branch: HyperNode = {
      id: 'b1', type: 'branch', position: { x: 0, y: 0 }, data: { label: 'Branch', config: { key: 'input' } }, inputs: [{ id: 'bi', label: 'In', type: 'json' }], outputs: [{ id: 'bo', label: 'Out', type: 'json' }]
    };
    const merge: HyperNode = {
      id: 'm1', type: 'merge', position: { x: 0, y: 0 }, data: { label: 'Merge', config: { strategy: 'last', inputs: ['a','b'] } }, inputs: [{ id: 'mi', label: 'In', type: 'json' }], outputs: [{ id: 'mo', label: 'Out', type: 'json' }]
    };
    const condition: HyperNode = {
      id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { label: 'Cond', config: { predicateKey: 'ok', truthyOut: 'true', falsyOut: 'false' } }, inputs: [{ id: 'ci', label: 'In', type: 'json' }], outputs: [{ id: 'co', label: 'Out', type: 'json' }]
    };
    const g: HyperGraph = { id: 'rg1', nodes: [branch, merge, condition], edges: [] };

    const bOut = await executeNode(branch, { input: [1,2,3] }, console.log, g);
    expect(bOut).toBeDefined();
    expect('branches' in bOut).toBe(true);

    const mOut = await executeNode(merge, { a: { x: 1 }, b: { x: 2, y: 3 } } as NodeIO, console.log, g);
    expect(mOut).toBeDefined();
    expect('a' in mOut && 'b' in mOut).toBe(true);

    const cOutTrue = await executeNode(condition, { ok: true, v: 1 }, console.log, g);
    const cOutFalse = await executeNode(condition, { ok: false, v: 1 }, console.log, g);
    expect('true' in cOutTrue).toBe(true);
    expect('false' in cOutFalse).toBe(true);
  });
});
