import { isSupportedNodeType } from "./node-id.mjs";

const EDGE_TYPES = new Set(["contains", "imports"]);
const SYMBOL_TYPES = new Set(["class", "function"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validSourceRange(source) {
  if (!isObject(source)) return false;
  const ints = [source.start_line, source.start_column, source.end_line, source.end_column];
  if (!ints.every(Number.isInteger)) return false;
  if (source.start_line < 1 || source.end_line < 1 || source.start_column < 0 || source.end_column < 0) return false;
  if (source.end_line < source.start_line) return false;
  if (source.end_line === source.start_line && source.end_column < source.start_column) return false;
  return typeof source.signature === "string" && source.signature.length > 0;
}

export function validateIndex(index) {
  const errors = [];
  if (!isObject(index)) return { ok: false, errors: ["index must be an object"] };
  if (index.schema_version !== 1) errors.push("schema_version must be 1");
  if (!isObject(index.tool) || index.tool.name !== "repoaxis" || typeof index.tool.version !== "string") {
    errors.push("tool must identify repoaxis and include a version");
  }
  if (index.authority !== "git+working-tree") errors.push("authority must be git+working-tree");
  if (!isObject(index.repository) || index.repository.root !== ".") errors.push("repository.root must be '.'");
  if (!isObject(index.generated)) errors.push("generated must be an object");
  const nodes = index.generated?.nodes;
  const edges = index.generated?.edges;
  if (!isObject(nodes)) errors.push("generated.nodes must be an object");
  if (!Array.isArray(edges)) errors.push("generated.edges must be an array");
  if (!isObject(index.generated?.refresh) || typeof index.generated.refresh.reason !== "string") {
    errors.push("generated.refresh.reason must be a string");
  }
  if (isObject(nodes)) {
    for (const [id, node] of Object.entries(nodes)) {
      if (!isObject(node)) { errors.push(`node ${id} must be an object`); continue; }
      if (node.id !== id) errors.push(`node ${id} must repeat its key in node.id`);
      if (!isSupportedNodeType(node.type)) errors.push(`node ${id} has unsupported type`);
      if (typeof node.path !== "string" || !node.path) errors.push(`node ${id} must include path`);
      if (SYMBOL_TYPES.has(node.type)) {
        if (typeof node.qualified_name !== "string" || !node.qualified_name) errors.push(`symbol ${id} must include qualified_name`);
        if (typeof node.parent_id !== "string" || !node.parent_id) errors.push(`symbol ${id} must include parent_id`);
        if (!validSourceRange(node.source)) errors.push(`symbol ${id} must include a valid source range and signature`);
      }
    }
    for (const [id, node] of Object.entries(nodes)) {
      if (SYMBOL_TYPES.has(node.type) && !nodes[node.parent_id]) errors.push(`symbol ${id} references a missing parent_id`);
    }
  }
  if (Array.isArray(edges) && isObject(nodes)) {
    const seen = new Set();
    edges.forEach((edge, i) => {
      if (!isObject(edge) || !EDGE_TYPES.has(edge.type)) errors.push(`edge ${i} has unsupported type`);
      if (!nodes[edge?.from] || !nodes[edge?.to]) errors.push(`edge ${i} references a missing node`);
      const key = `${edge?.type}\0${edge?.from}\0${edge?.to}`;
      if (seen.has(key)) errors.push(`edge ${i} duplicates an existing edge`);
      seen.add(key);
    });
  }
  if (!isObject(index.annotations)) errors.push("annotations must be an object");
  return { ok: errors.length === 0, errors };
}
