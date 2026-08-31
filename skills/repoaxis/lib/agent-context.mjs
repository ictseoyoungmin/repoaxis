import { compactNode, importedBy, importsFrom, resolveNode } from "./query.mjs";

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function parentNode(index, node) {
  if (node.parent_id) return index?.generated?.nodes?.[node.parent_id] ?? null;
  const edge = (index?.generated?.edges ?? []).find((candidate) => candidate.type === "contains" && candidate.to === node.id);
  return edge ? index?.generated?.nodes?.[edge.from] ?? null : null;
}

function containmentAncestors(index, node) {
  const ancestors = [];
  const seen = new Set([node.id]);
  let current = node;
  while (true) {
    const parent = parentNode(index, current);
    if (!parent || seen.has(parent.id)) break;
    ancestors.push(parent);
    seen.add(parent.id);
    current = parent;
  }
  return ancestors;
}

function containingFile(index, node) {
  if (node.type === "file") return node;
  if (node.type === "class" || node.type === "function") {
    return index?.generated?.nodes?.[`file:${node.path}`]
      ?? containmentAncestors(index, node).find((candidate) => candidate.type === "file")
      ?? null;
  }
  return null;
}

function directChildren(index, node) {
  const nodes = index?.generated?.nodes ?? {};
  return (index?.generated?.edges ?? [])
    .filter((edge) => edge.type === "contains" && edge.from === node.id)
    .map((edge) => nodes[edge.to])
    .filter(Boolean)
    .sort((a, b) => compareText(a.id, b.id));
}

function sourceLocation(node) {
  if (!node.source) return null;
  return {
    start_line: node.source.start_line,
    start_column: node.source.start_column,
    end_line: node.source.end_line,
    end_column: node.source.end_column,
  };
}

export function agentContext(index, target) {
  const node = resolveNode(index, target);
  const file = containingFile(index, node);
  const ancestors = containmentAncestors(index, node).reverse().map(compactNode);
  const annotation = index?.annotations?.[node.id] ?? null;
  const result = {
    snapshot: {
      head_sha: index?.repository?.head_sha ?? null,
      head_ref: index?.repository?.head_ref ?? null,
      refresh_reason: index?.generated?.refresh?.reason ?? null,
    },
    target: compactNode(node),
    location: sourceLocation(node),
    containment_path: ancestors,
    children: directChildren(index, node).map(compactNode),
    annotation,
    file: null,
    dependencies: null,
  };

  if (!file) return result;

  result.file = {
    node: compactNode(file),
    git: file.git ?? null,
    change: (index?.generated?.git_changes ?? []).find((change) => change.path === file.path) ?? null,
    annotation: file.id === node.id ? annotation : index?.annotations?.[file.id] ?? null,
  };
  result.dependencies = {
    imports: importsFrom(index, file.id).map(compactNode),
    imported_by: importedBy(index, file.id).map(compactNode),
  };
  return result;
}

function containmentTail(index, file, target) {
  if (file.id === target.id) return { nodes: [compactNode(file)], edges: [] };
  const chain = [target];
  const seen = new Set([target.id]);
  let current = target;
  while (current.id !== file.id) {
    const parent = parentNode(index, current);
    if (!parent || seen.has(parent.id)) return null;
    chain.push(parent);
    seen.add(parent.id);
    current = parent;
  }
  chain.reverse();
  return {
    nodes: chain.map(compactNode),
    edges: Array.from({ length: chain.length - 1 }, () => ({ type: "contains" })),
  };
}

function upstreamImportPaths(index, targetFile, { maxDepth, maxPaths }) {
  const nodes = index?.generated?.nodes ?? {};
  const incoming = new Map();
  for (const edge of index?.generated?.edges ?? []) {
    if (edge.type !== "imports" || !nodes[edge.from] || !nodes[edge.to]) continue;
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to).push(edge.from);
  }
  for (const values of incoming.values()) values.sort(compareText);

  const queue = [{ id: targetFile.id, reversed: [targetFile.id] }];
  const paths = [];
  let truncated = false;
  while (queue.length) {
    const current = queue.shift();
    const depth = current.reversed.length - 1;
    const predecessors = incoming.get(current.id) ?? [];
    if (predecessors.length === 0) {
      paths.push([...current.reversed].reverse());
      if (paths.length >= maxPaths) {
        truncated = queue.length > 0;
        break;
      }
      continue;
    }
    if (depth >= maxDepth) {
      truncated = true;
      continue;
    }
    for (const predecessor of predecessors) {
      if (current.reversed.includes(predecessor)) continue;
      queue.push({ id: predecessor, reversed: [...current.reversed, predecessor] });
    }
  }

  return {
    paths: paths.map((ids) => ({
      nodes: ids.map((id) => compactNode(nodes[id])),
      edges: Array.from({ length: ids.length - 1 }, () => ({ type: "imports" })),
    })),
    truncated,
  };
}

export function whyNode(index, target, { maxDepth = 8, maxPaths = 3 } = {}) {
  if (!Number.isInteger(maxDepth) || maxDepth < 1) throw new Error("maxDepth must be a positive integer");
  if (!Number.isInteger(maxPaths) || maxPaths < 1) throw new Error("maxPaths must be a positive integer");

  const node = resolveNode(index, target);
  const file = containingFile(index, node);

  if (!file) {
    const ancestors = containmentAncestors(index, node).reverse();
    const pathNodes = [...ancestors, node];
    return {
      target: compactNode(node),
      basis: ["contains"],
      origin_rule: "repository containment root",
      paths: [{
        nodes: pathNodes.map(compactNode),
        edges: Array.from({ length: Math.max(0, pathNodes.length - 1) }, () => ({ type: "contains" })),
      }],
      direct_imported_by: [],
      truncated: false,
    };
  }

  const tail = containmentTail(index, file, node);
  const upstream = upstreamImportPaths(index, file, { maxDepth, maxPaths });
  const paths = upstream.paths.map((path) => ({
    nodes: [...path.nodes, ...tail.nodes.slice(1)],
    edges: [...path.edges, ...tail.edges],
  }));

  if (upstream.paths.length === 0 && importedBy(index, file.id).length === 0) {
    paths.push({ nodes: tail.nodes, edges: tail.edges });
  }

  return {
    target: compactNode(node),
    basis: ["imports", "contains"],
    origin_rule: "indexed file with no incoming imports; not inferred as a runtime entry point",
    paths,
    direct_imported_by: importedBy(index, file.id).map(compactNode),
    truncated: upstream.truncated,
  };
}
