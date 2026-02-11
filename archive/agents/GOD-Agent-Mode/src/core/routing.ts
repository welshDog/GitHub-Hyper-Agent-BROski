export type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];
export type PortValue = JsonValue | undefined;
export type NodeIO = Record<string, PortValue>;

export function routeBranch(input: NodeIO, key: string): Record<string, NodeIO> {
  const v = input[key];
  if (Array.isArray(v)) {
    return { branches: v.map((x) => ({ item: x })) } as unknown as Record<string, NodeIO>;
  }
  return { branches: [{ item: v }] } as unknown as Record<string, NodeIO>;
}

export function routeMerge(inputs: NodeIO[], strategy: 'first' | 'last' = 'last'): NodeIO {
  const out: NodeIO = {};
  for (const io of inputs) {
    for (const k of Object.keys(io)) {
      if (strategy === 'first' && out[k] !== undefined) continue;
      out[k] = io[k];
    }
  }
  return out;
}

export function routeCondition(input: NodeIO, predicateKey: string, truthyOut: string, falsyOut: string): Record<string, NodeIO> {
  const cond = Boolean(input[predicateKey]);
  const out: Record<string, NodeIO> = {};
  out[cond ? truthyOut : falsyOut] = input;
  return out;
}
