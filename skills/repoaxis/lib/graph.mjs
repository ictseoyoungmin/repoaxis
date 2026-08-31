import { isSupportedNodeType } from "./node-id.mjs";

const EDGE_TYPES = new Set(["contains", "imports"]);

export function createEmptyGraph() {
  return { nodes: {}, edges: [] };
}

export function addNode(graph, node) {
  if (!graph || typeof graph !== "object") throw new TypeError("graph is required");
  if (!node || typeof node !== "object") throw new TypeError("node is required");
  if (typeof node.id !== "string" || !node.id) throw new Error("node.id is required");
  if (!isSupportedNodeType(node.type)) throw new Error(`unsupported node type: ${node.type}`);
  if (graph.nodes[node.id]) throw new Error(`duplicate node: ${node.id}`);
  graph.nodes[node.id] = { ...node };
  return node.id;
}

export function addEdge(graph, edge) {
  if (!EDGE_TYPES.has(edge?.type)) throw new Error(`unsupported edge type: ${edge?.type}`);
  if (!graph.nodes[edge.from] || !graph.nodes[edge.to]) {
    throw new Error("edge endpoints must exist in graph");
  }
  graph.edges.push({ type: edge.type, from: edge.from, to: edge.to, ...(edge.meta ? { meta: edge.meta } : {}) });
}
