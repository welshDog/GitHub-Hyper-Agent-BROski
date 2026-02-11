"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import type { Connection, Edge, Node } from "reactflow";
import CompositeEditor from "./CompositeEditor";
import "reactflow/dist/style.css";
import type { HyperGraph, HyperNode } from "../src/core/schema";
import { HyperGraphSchema } from "../src/core/schema";
import { runPrototypeFlow, runPantheonFlow } from "../src/core/engine";

type RFData = { label: string; config?: Record<string, unknown>; hyperType?: string };
function toRF(graph: HyperGraph) {
  const nodes: Node[] = graph.nodes.map((n: HyperNode) => ({
    id: n.id,
    position: n.position,
    data: { label: n.data.label, config: n.data.config, hyperType: n.type },
    type: "default",
  }));
  const edges: Edge[] = graph.edges.map((e: HyperGraph['edges'][number]) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));
  return { nodes, edges };
}

export default function Canvas({ initial }: { initial: HyperGraph }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => toRF(initial), [initial]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = React.useState<Node | null>(null);
  const [grid, setGrid] = React.useState<[number, number]>([16, 16]);
  const [runError, setRunError] = React.useState<string | null>(null);
  const rfRef = useRef<HTMLDivElement | null>(null);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes: ns }: { nodes: Node[] }) => {
    setSelected(ns[0] ?? null);
  }, []);

  const run = useCallback(async () => {
    const hnodes: HyperNode[] = nodes.map((n) => ({
      id: n.id,
      type: initial.nodes.find((hn: HyperNode) => hn.id === n.id)?.type || "processor",
      position: n.position,
      data: { label: String((n.data as RFData)?.label || "Node"), config: (n.data as RFData)?.config },
      inputs: [],
      outputs: [],
    }));
    const hgraph: HyperGraph = {
      id: initial.id,
      nodes: hnodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: String(e.sourceHandle || "output"),
        targetHandle: String(e.targetHandle || "input"),
      })),
    };
    HyperGraphSchema.parse(hgraph);
    await runPrototypeFlow(hgraph);
  }, [nodes, edges, initial]);

  useEffect(() => {
    const saved = localStorage.getItem('hyperflowGraph');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const safe = HyperGraphSchema.parse(parsed);
        const rf = toRF(safe);
        setNodes(rf.nodes);
        setEdges(rf.edges);
      } catch {}
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    const hnodes: HyperNode[] = nodes.map((n: Node) => ({
      id: n.id,
      type: initial.nodes.find((hn: HyperNode) => hn.id === n.id)?.type || "processor",
      position: n.position,
      data: { label: String((n.data as RFData)?.label || "Node"), config: (n.data as RFData)?.config },
      inputs: [],
      outputs: [],
    }));
    const hgraph: HyperGraph = {
      id: initial.id,
      nodes: hnodes,
      edges: edges.map((e: Edge) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: String(e.sourceHandle || "output"), targetHandle: String(e.targetHandle || "input") })),
    };
    localStorage.setItem('hyperflowGraph', JSON.stringify(hgraph));
  }, [nodes, edges, initial.id, initial.nodes]);

  const addNode = useCallback((type: string) => {
    const id = `node-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const pos = { x: 100 + Math.random()*200, y: 100 + Math.random()*120 };
    const data: RFData = { label: type.charAt(0).toUpperCase() + type.slice(1) };
    if (type === 'csvInput') {
      data.config = { value: 'name,age\nAda,36\nTuring,42' };
    }
    if (type === 'map') {
      data.config = { mode: 'uppercase' };
    }
    if (type === 'branch') {
      data.config = { key: 'input' };
    }
    if (type === 'merge') {
      data.config = { strategy: 'last', inputs: ['a','b'] };
    }
    if (type === 'condition') {
      data.config = { predicateKey: 'ok', truthyOut: 'true', falsyOut: 'false' };
    }
    if (type === 'composite') {
      const subgraph: HyperGraph = {
        id: `sub-${id}`,
        nodes: [
          { id: 's1', type: 'csvInput', position: { x: 0, y: 0 }, data: { label: 'CSV', config: { value: 'city,pop\nNeo,100\nZion,200' } }, inputs: [], outputs: [{ id: 'so1', label: 'Out', type: 'json' }] },
          { id: 's2', type: 'map', position: { x: 200, y: 0 }, data: { label: 'Upper' }, inputs: [{ id: 'si1', label: 'In', type: 'json' }], outputs: [{ id: 'so2', label: 'Out', type: 'json' }] },
          { id: 's3', type: 'sinkConsole', position: { x: 400, y: 0 }, data: { label: 'Sink' }, inputs: [{ id: 'si2', label: 'In', type: 'json' }], outputs: [] }
        ],
        edges: [
          { id: 'se1', source: 's1', sourceHandle: 'so1', target: 's2', targetHandle: 'si1' },
          { id: 'se2', source: 's2', sourceHandle: 'so2', target: 's3', targetHandle: 'si2' }
        ]
      };
      data.config = { ...(data.config || {}), subgraph };
    }
    setNodes((nds) => nds.concat({ id, position: pos, data: data as unknown as Node['data'], type: 'default' } as Node));
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (!window.confirm('Delete selected node?')) return;
    const id = selected.id;
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelected(null);
  }, [selected, setNodes, setEdges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        addNode('processor');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelected, addNode]);

  return (
    <div className="h-screen w-screen">
      <div className="flex h-full">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            snapToGrid
            snapGrid={grid}
            fitView
          >
            <Background />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
        <div className="w-80 border-l border-white/10 p-4">
          <div className="text-sm opacity-80">Properties</div>
          {selected ? (
            <div className="mt-4 space-y-2">
              <div className="text-xs">ID</div>
              <div className="text-sm">{selected.id}</div>
              <div className="text-xs mt-3">Label</div>
              <input
                className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full"
                value={String(selected.data?.label || "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes((nds) => nds.map((n) => n.id === selected.id ? { ...n, data: { label: val } } : n));
                }}
                aria-label="Node Label"
              />
              {String((selected.data as RFData)?.hyperType || '') === 'composite' ? (
                <CompositeEditor
                  value={(selected.data as RFData)?.config?.subgraph as unknown as HyperGraph}
                  onChange={(sub) => {
                    setNodes((nds) => nds.map((n) => {
                      if (n.id !== selected.id) return n;
                      const d = n.data as RFData;
                      const next: RFData = { ...d, config: { ...(d.config || {}), subgraph: sub } };
                      return { ...n, data: next as unknown as Node['data'] };
                    }));
                  }}
                />
              ) : null}
              <button
                className="mt-4 bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                onClick={run}
                aria-label="Run Flow"
              >
                Run Flow
              </button>
              <button
                className="mt-2 bg-purple-500/30 hover:bg-purple-500/40 px-3 py-1 rounded"
                onClick={async () => {
                  try {
                    const hnodes: HyperNode[] = nodes.map((n: Node) => ({
                      id: n.id,
                      type: initial.nodes.find((hn: HyperNode) => hn.id === n.id)?.type || "processor",
                      position: n.position,
                      data: { label: String((n.data as RFData)?.label || "Node"), config: (n.data as RFData)?.config },
                      inputs: [],
                      outputs: [],
                    }));
                    const hgraph: HyperGraph = {
                      id: initial.id,
                      nodes: hnodes,
                      edges: edges.map((e: Edge) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: String(e.sourceHandle || "output"), targetHandle: String(e.targetHandle || "input") })),
                    };
                    HyperGraphSchema.parse(hgraph);
                    await runPantheonFlow(hgraph);
                    setRunError(null);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error(msg);
                    setRunError(msg);
                    alert(msg);
                  }
                }}
                aria-label="Run Pantheon"
              >
                Run with Pantheon
              </button>
              {runError ? (
                <div className="text-xs text-red-400">{runError}</div>
              ) : null}
              <button
                className="mt-2 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded"
                onClick={deleteSelected}
                aria-label="Delete Selected"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="mt-4 text-sm opacity-60">Select a node</div>
          )}
          <div className="mt-6">
            <div className="text-sm opacity-80">Grid</div>
            <select
              className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full"
              value={grid[0]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setGrid([v, v]);
              }}
              aria-label="Grid Size"
            >
              <option value={8}>8px</option>
              <option value={16}>16px</option>
              <option value={32}>32px</option>
            </select>
          </div>
          <div className="mt-6">
            <div className="text-sm opacity-80">Palette</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('csvInput')} aria-label="Add CSV Input">CSV Input</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('map')} aria-label="Add Map">Map</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('sinkConsole')} aria-label="Add Console Sink">Console Sink</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('branch')} aria-label="Add Branch">Branch</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('merge')} aria-label="Add Merge">Merge</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded" onClick={() => addNode('condition')} aria-label="Add Condition">Condition</button>
              <button className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded col-span-2" onClick={() => addNode('composite')} aria-label="Add Composite">Composite</button>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm opacity-80">Data</div>
            <div className="mt-2 flex gap-2">
              <button
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                onClick={() => {
                  const hnodes: HyperNode[] = nodes.map((n: Node) => ({ id: n.id, type: initial.nodes.find((hn: HyperNode) => hn.id === n.id)?.type || 'processor', position: n.position, data: { label: String(n.data?.label || 'Node') }, inputs: [], outputs: [] }));
                  const hgraph: HyperGraph = { id: initial.id, nodes: hnodes, edges: edges.map((e: Edge) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: String(e.sourceHandle || 'output'), targetHandle: String(e.targetHandle || 'input') })) };
                  const blob = new Blob([JSON.stringify(hgraph, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'hypergraph.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                aria-label="Export JSON"
              >
                Export
              </button>
              <label className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded cursor-pointer" aria-label="Import JSON">
                Import
                <input type="file" accept="application/json" className="hidden" onChange={async (ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const parsed = JSON.parse(text);
                    const safe = HyperGraphSchema.parse(parsed);
                    const rf = toRF(safe);
                    setNodes(rf.nodes);
                    setEdges(rf.edges);
                  } catch {}
                }} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
