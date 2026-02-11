export const dynamic = 'force-dynamic';
import Canvas from "../components/Canvas";
import type { HyperGraph, HyperNode } from "../src/core/schema";

const node1: HyperNode = {
  id: "node-1",
  type: "input",
  position: { x: 0, y: 0 },
  data: { label: "Start", config: { value: "hyperflow is alive" } },
  inputs: [],
  outputs: [{ id: "p1", label: "Out", type: "string" }],
};

const node2: HyperNode = {
  id: "node-2",
  type: "processor",
  position: { x: 200, y: 0 },
  data: { label: "UpperCasifier" },
  inputs: [{ id: "p2", label: "In", type: "string" }],
  outputs: [{ id: "p3", label: "Out", type: "string" }],
};

const graph: HyperGraph = {
  id: "graph-1",
  nodes: [node1, node2],
  edges: [
    { id: "edge-1", source: "node-1", sourceHandle: "p1", target: "node-2", targetHandle: "p2" },
  ],
};

export default function Page() {
  return <Canvas initial={graph} />;
}
