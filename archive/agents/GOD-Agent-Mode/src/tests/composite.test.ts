import { executeNode } from '../core/engine';
import type { HyperGraph, HyperNode } from '../core/schema';
import { describe, it, expect } from 'vitest';

describe('Composite Node', () => {
  it('executes subgraph and returns result', async () => {
    const composite: HyperNode = {
      id: 'c1',
      type: 'composite',
      position: { x: 0, y: 0 },
      data: {
        label: 'Composite',
        config: {
          subgraph: {
            id: 'sub-c1',
            nodes: [
              { id: 's1', type: 'csvInput', position: { x: 0, y: 0 }, data: { label: 'CSV', config: { value: 'a,b\n1,2' } }, inputs: [], outputs: [{ id: 'so1', label: 'Out', type: 'json' }] },
              { id: 's2', type: 'map', position: { x: 200, y: 0 }, data: { label: 'Upper' }, inputs: [{ id: 'si1', label: 'In', type: 'json' }], outputs: [{ id: 'so2', label: 'Out', type: 'json' }] },
              { id: 's3', type: 'sinkConsole', position: { x: 400, y: 0 }, data: { label: 'Sink' }, inputs: [{ id: 'si2', label: 'In', type: 'json' }], outputs: [] }
            ],
            edges: [
              { id: 'se1', source: 's1', sourceHandle: 'so1', target: 's2', targetHandle: 'si1' },
              { id: 'se2', source: 's2', sourceHandle: 'so2', target: 's3', targetHandle: 'si2' }
            ]
          }
        }
      },
      inputs: [],
      outputs: [{ id: 'co', label: 'Out', type: 'json' }]
    };

    const g: HyperGraph = { id: 'g1', nodes: [composite], edges: [] };
    const out = await executeNode(composite, {}, console.log, g);
    expect(out).toBeDefined();
    expect('result' in out).toBe(true);
  });
});
