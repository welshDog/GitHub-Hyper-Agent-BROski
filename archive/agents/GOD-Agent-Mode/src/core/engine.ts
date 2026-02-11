import type { HyperNode, HyperGraph } from './schema';
import { HyperGraphSchema } from './schema';
import { validateGraphReferences } from './validate';
import { routeBranch, routeMerge, routeCondition } from './routing';

// ==========================================
// ⚡ The Hyperflow Engine (Prototype)
// ==========================================

// Context passed to every node during execution
export type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];
export type PortValue = JsonValue | undefined;
export type NodeIO = Record<string, PortValue>;
export interface ExecutionContext {
  graph: HyperGraph;
  nodeId: string;
  inputs: NodeIO;
  log: (msg: string) => void;
}

// The definition of a Node's logic (The "Tool" in MCP terms)
export type NodeExecutor = (ctx: ExecutionContext) => Promise<NodeIO>;

// Registry of available node types
const NodeRegistry: Record<string, NodeExecutor> = {
  // 1. The Prototype "Echo" Node
  'processor': async (ctx) => {
    const inputVal = ctx.inputs['input'] || '';
    ctx.log(`Processing: ${inputVal}`);
    
    // Simulate async work (The "Flow")
    await new Promise(resolve => setTimeout(resolve, 100));

    if (typeof inputVal === 'string') {
      return { result: inputVal.toUpperCase() };
    }
    return { result: inputVal };
  },
  
  // 2. Input Node (Source)
  'input': async (ctx) => {
    // In a real app, this might pull from UI state or args
    const val = ctx.inputs['value'] || 'Hello Hyperflow';
    return { output: val };
  },
  
  // 3. Output Node (Sink)
  'output': async (ctx) => {
    ctx.log(`OUTPUT RECEIVED: ${JSON.stringify(ctx.inputs)}`);
    return {};
  }
};

NodeRegistry['composite'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const sub = (node?.data.config as { subgraph?: unknown } | undefined)?.subgraph;
  if (!sub) return {};
  const safe = HyperGraphSchema.parse(sub);
  const errs = validateGraphReferences(safe);
  if (errs.length) {
    ctx.log(`Composite subgraph reference errors: ${JSON.stringify(errs)}`);
  }
  const state = await runPrototypeFlow(safe);
  const out: Record<string, JsonValue> = {};
  for (const k of Object.keys(state)) {
    const io = state[k] as NodeIO;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(io as object)) {
      const v = io[key];
      normalized[key] = v === undefined ? null : (v as JsonValue);
    }
    out[k] = normalized;
  }
  return { result: out };
};

NodeRegistry['branch'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const key = (node?.data.config as { key?: string } | undefined)?.key ?? 'input';
  const res = routeBranch(ctx.inputs, key);
  const normalized: Record<string, JsonValue> = {};
  for (const k of Object.keys(res)) {
    const io = res[k] as Record<string, PortValue> | undefined;
    const obj: Record<string, JsonValue> = {};
    const safeIo = (io ?? {}) as Record<string, PortValue>;
    for (const kk of Object.keys(safeIo)) {
      const v = safeIo[kk];
      obj[kk] = v === undefined ? null : (v as JsonValue);
    }
    normalized[k] = obj;
  }
  return { branches: normalized };
};

NodeRegistry['merge'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const strategy = (node?.data.config as { strategy?: 'first' | 'last' } | undefined)?.strategy ?? 'last';
  const inputsKeys = (node?.data.config as { inputs?: string[] } | undefined)?.inputs ?? Object.keys(ctx.inputs);
  const list = inputsKeys.map((k: string) => ({ [k]: ctx.inputs[k] }));
  const merged = routeMerge(list, strategy);
  return merged;
};

NodeRegistry['condition'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const predicateKey = (node?.data.config as { predicateKey?: string } | undefined)?.predicateKey ?? 'ok';
  const truthyOut = (node?.data.config as { truthyOut?: string } | undefined)?.truthyOut ?? 'true';
  const falsyOut = (node?.data.config as { falsyOut?: string } | undefined)?.falsyOut ?? 'false';
  const res = routeCondition(ctx.inputs, predicateKey, truthyOut, falsyOut);
  const t = res[truthyOut];
  const f = res[falsyOut];
  const normalize = (io?: NodeIO): Record<string, JsonValue> => {
    if (!io) return {};
    const obj: Record<string, JsonValue> = {};
    for (const k of Object.keys(io)) {
      const v = io[k];
      obj[k] = v === undefined ? null : (v as JsonValue);
    }
    return obj;
  };
  return { [truthyOut]: normalize(t), [falsyOut]: normalize(f) };
};

// Additional ETL-style executors
NodeRegistry['csvInput'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const raw = (node?.data.config as { value?: string } | undefined)?.value ?? '';
  const rows = String(raw)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','));
  return { output: rows };
};

NodeRegistry['map'] = async (ctx) => {
  const node = ctx.graph.nodes.find((n) => n.id === ctx.nodeId);
  const mode = (node?.data.config as { mode?: string } | undefined)?.mode ?? 'uppercase';
  const input = ctx.inputs['input'];
  if (Array.isArray(input)) {
    const mapped = input.map((row) =>
      (Array.isArray(row) ? row : [row]).map((cell: unknown) => {
        const s = String(cell ?? '');
        return mode === 'uppercase' ? s.toUpperCase() : s;
      })
    );
    return { result: mapped };
  }
  const s = String(input ?? '');
  return { result: mode === 'uppercase' ? s.toUpperCase() : s };
};

NodeRegistry['sinkConsole'] = async (ctx) => {
  ctx.log(`SINK: ${JSON.stringify(ctx.inputs)}`);
  return {};
};

/**
 * Executes a single node given its inputs.
 */
export async function executeNode(
  node: HyperNode,
  inputs: NodeIO,
  logger: (msg: string) => void = console.log,
  graph: HyperGraph = { id: 'temp', nodes: [], edges: [] }
): Promise<NodeIO> {
  const executor = NodeRegistry[node.type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${node.type}`);
  }

  // 🛡️ Safe Execution Boundary
  try {
    const outputs = await executor({
      graph,
      nodeId: node.id,
      inputs,
      log: logger
    });
    return outputs;
  } catch (error) {
    logger(`ERROR in Node ${node.id}: ${error}`);
    throw error;
  }
}

/**
 * Simple Linear Runner for Prototype Verification
 * (In the full version, this will be a Topological Sort Graph Runner)
 */
export async function runPrototypeFlow(graph: HyperGraph) {
  console.log('⚡ Starting Hyperflow Execution...');
  const refErrors = validateGraphReferences(graph);
  if (refErrors.length) {
    console.warn('Graph reference validation errors:', refErrors);
  }
  
  // 1. Find Input Nodes
  const inputs = graph.nodes.filter((n: HyperNode) => n.type === 'input');
  
  // State map: NodeID -> Outputs
  const state: Record<string, NodeIO> = {};

  // Super naive execution loop (just for the prototype demo)
  for (const inputNode of inputs) {
    // Run Input
    const initialValue = typeof inputNode.data.config?.value === 'string' ? inputNode.data.config?.value : '';
    const inputResult = await executeNode(inputNode, { value: initialValue }, console.log, graph);
    state[inputNode.id] = inputResult;
    console.log(`[${inputNode.data.label}] Emitted:`, inputResult);

    // Find edges connected to this input
    const edges = graph.edges.filter((e: HyperGraph['edges'][number]) => e.source === inputNode.id);
    
    for (const edge of edges) {
      const targetNode = graph.nodes.find((n: HyperNode) => n.id === edge.target);
      if (targetNode) {
        const outKey = edge.sourceHandle || Object.keys(inputResult)[0];
        const inKey = edge.targetHandle || 'input';
        const nodeInputs: Record<string, PortValue> = {};
        nodeInputs[inKey] = inputResult[outKey as keyof typeof inputResult] as PortValue;
        const targetResult = await executeNode(targetNode, nodeInputs as NodeIO, console.log, graph);
        state[targetNode.id] = targetResult;
        console.log(`[${targetNode.data.label}] Emitted:`, targetResult);
      }
    }
  }
  
  console.log('⚡ Flow Complete.');
  return state;
}

export async function runPantheonFlow(graph: HyperGraph) {
  console.log('👑 Pantheon: orchestrating agents over Hyperflow...');
  const result = await runPrototypeFlow(graph);
  console.log('👑 Pantheon: run complete.');
  return result;
}
