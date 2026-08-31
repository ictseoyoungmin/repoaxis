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
