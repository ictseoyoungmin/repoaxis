function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function summarizeIndex(index) {
  const nodes = Object.values(index?.generated?.nodes ?? {});
  const byType = { folder: 0, file: 0, class: 0, function: 0 };
  for (const node of nodes) {
    if (Object.hasOwn(byType, node.type)) byType[node.type] += 1;
  }
  return {
    schema_version: index?.schema_version ?? null,
    authority: index?.authority ?? null,
    head_sha: index?.repository?.head_sha ?? null,
    head_ref: index?.repository?.head_ref ?? null,
    nodes: nodes.length,
    edges: index?.generated?.edges?.length ?? 0,
    annotations: Object.keys(index?.annotations ?? {}).length,
    by_type: byType,
  };
}

function importEdges(index) {
  return (index?.generated?.edges ?? []).filter((edge) => edge.type === "imports");
}

export function importsFrom(index, fileId) {
  const nodes = index?.generated?.nodes ?? {};
  return importEdges(index)
    .filter((edge) => edge.from === fileId)
    .map((edge) => nodes[edge.to])
    .filter(Boolean)
    .sort((a, b) => compareText(a.id, b.id));
}

export function importedBy(index, fileId) {
  const nodes = index?.generated?.nodes ?? {};
  return importEdges(index)
    .filter((edge) => edge.to === fileId)
    .map((edge) => nodes[edge.from])
    .filter(Boolean)
    .sort((a, b) => compareText(a.id, b.id));
}

export function compactNode(node) {
  const result = { id: node.id, type: node.type, path: node.path };
  if (node.qualified_name) result.qualified_name = node.qualified_name;
  if (node.source?.signature) result.signature = node.source.signature;
  if (node.git) {
    result.git = {
      tracked: node.git.tracked,
      working: node.git.working,
      staged: node.git.staged,
      conflicted: node.git.conflicted,
    };
    if (node.git.last_commit) {
      result.git.last_commit = {
        sha: node.git.last_commit.sha,
        subject: node.git.last_commit.subject,
      };
    } else if (node.git.last_commit === null) {
      result.git.last_commit = null;
    }
  }
  return result;
}

function displayTarget(node) {
  return node.qualified_name ? `${node.path}:${node.qualified_name}` : node.path;
}

function searchableFields(node) {
  return [node.id, node.path, node.qualified_name, displayTarget(node)].filter(Boolean);
}

function matchRank(node, query) {
  const q = query.toLowerCase();
  const fields = searchableFields(node).map((value) => value.toLowerCase());
  if (fields[0] === q) return 0;
  if (fields.includes(q)) return 1;
  if (fields.some((value) => value.startsWith(q))) return 2;
  if (fields.some((value) => value.includes(q))) return 3;
  return null;
}

export function findNodes(index, query, { limit = 20 } = {}) {
  if (typeof query !== "string" || !query.trim()) throw new Error("find query must be non-empty");
  if (!Number.isInteger(limit) || limit < 1) throw new Error("find limit must be a positive integer");
  const value = query.trim();
  const ranked = Object.values(index?.generated?.nodes ?? {})
    .map((node) => ({ node, rank: matchRank(node, value) }))
    .filter(({ rank }) => rank !== null)
    .sort((a, b) => a.rank - b.rank || compareText(a.node.id, b.node.id));
  return {
    query: value,
    total: ranked.length,
    matches: ranked.slice(0, limit).map(({ node }) => compactNode(node)),
  };
}

export function resolveNode(index, target) {
  if (typeof target !== "string" || !target.trim()) throw new Error("node target must be non-empty");
  const value = target.trim();
  const nodes = index?.generated?.nodes ?? {};
  if (nodes[value]) return nodes[value];

  const exact = Object.values(nodes)
    .filter((node) => node.path === value || node.qualified_name === value || displayTarget(node) === value)
    .sort((a, b) => compareText(a.id, b.id));
  const pathNode = exact.filter((node) => (node.type === "file" || node.type === "folder") && node.path === value);
  if (pathNode.length === 1) return pathNode[0];
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(`ambiguous node target: ${value}; matches: ${exact.slice(0, 8).map((node) => node.id).join(", ")}`);
  }

  const found = findNodes(index, value, { limit: 9 });
  if (found.total === 1) return nodes[found.matches[0].id];
  if (found.total === 0) throw new Error(`node not found: ${value}`);
  throw new Error(`ambiguous node target: ${value}; matches: ${found.matches.slice(0, 8).map((node) => node.id).join(", ")}`);
}

export function showNode(index, target) {
  const node = resolveNode(index, target);
  return {
    node,
    annotation: index?.annotations?.[node.id] ?? null,
  };
}

function edgeRecord(edge, node, direction) {
  const record = { type: edge.type, direction, node: compactNode(node) };
  if (edge.meta && Object.keys(edge.meta).length) record.meta = edge.meta;
  return record;
}

export function refsFor(index, target) {
  const node = resolveNode(index, target);
  const nodes = index?.generated?.nodes ?? {};
  const refs = [];
  for (const edge of index?.generated?.edges ?? []) {
    if (edge.from === node.id && nodes[edge.to]) refs.push(edgeRecord(edge, nodes[edge.to], "outgoing"));
    if (edge.to === node.id && nodes[edge.from]) refs.push(edgeRecord(edge, nodes[edge.from], "incoming"));
  }
  refs.sort((a, b) => compareText(a.type, b.type) || compareText(a.direction, b.direction) || compareText(a.node.id, b.node.id));
  return { target: compactNode(node), refs };
}

export function parentsOf(index, target) {
  const node = resolveNode(index, target);
  const nodes = index?.generated?.nodes ?? {};
  const parents = (index?.generated?.edges ?? [])
    .filter((edge) => edge.type === "contains" && edge.to === node.id)
    .map((edge) => nodes[edge.from])
    .filter(Boolean)
    .sort((a, b) => compareText(a.id, b.id))
    .map(compactNode);
  return { target: compactNode(node), parents };
}

export function childrenOf(index, target) {
  const node = resolveNode(index, target);
  const nodes = index?.generated?.nodes ?? {};
  const children = (index?.generated?.edges ?? [])
    .filter((edge) => edge.type === "contains" && edge.from === node.id)
    .map((edge) => nodes[edge.to])
    .filter(Boolean)
    .sort((a, b) => compareText(a.id, b.id))
    .map(compactNode);
  return { target: compactNode(node), children };
}

export function changedPaths(index, { stagedOnly = false } = {}) {
  const nodes = index?.generated?.nodes ?? {};
  const changes = (index?.generated?.git_changes ?? [])
    .filter((change) => !stagedOnly || change.staged !== false)
    .map((change) => {
      const record = { ...change };
      const fileId = `file:${change.path}`;
      if (nodes[fileId]) record.node_id = fileId;
      return record;
    })
    .sort((a, b) => compareText(a.path, b.path));
  return { staged_only: stagedOnly, count: changes.length, changes };
}
