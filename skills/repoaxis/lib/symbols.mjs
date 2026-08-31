import fs from "node:fs";
import path from "node:path";
import { addEdge, addNode } from "./graph.mjs";
import { extractJavaScriptSymbols, JAVASCRIPT_PARSER, supportsJavaScript } from "./languages/javascript.mjs";
import { makeNodeId } from "./node-id.mjs";

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function absolutePath(root, repoPath) {
  return path.join(root, ...repoPath.split("/"));
}

function uniqueIdentity(graph, type, repoPath, qualifiedName, source) {
  let candidate = qualifiedName;
  let id = makeNodeId(type, repoPath, candidate);
  if (!graph.nodes[id]) return { id, qualifiedName: candidate };

  const loc = `@L${source.start_line}C${source.start_column}`;
  candidate = `${qualifiedName}${loc}`;
  id = makeNodeId(type, repoPath, candidate);
  let suffix = 2;
  while (graph.nodes[id]) {
    candidate = `${qualifiedName}${loc}#${suffix++}`;
    id = makeNodeId(type, repoPath, candidate);
  }
  return { id, qualifiedName: candidate };
}

function parseStatusMeta(result) {
  if (result.diagnostic.status === "ok") {
    return {
      language: "javascript",
      parser: JAVASCRIPT_PARSER.name,
      parser_version: JAVASCRIPT_PARSER.version,
      status: "ok",
      count: result.symbols.length,
    };
  }
  return {
    language: "javascript",
    parser: JAVASCRIPT_PARSER.name,
    parser_version: JAVASCRIPT_PARSER.version,
    status: "error",
    count: 0,
    error: {
      message: result.diagnostic.message,
      line: result.diagnostic.line,
      column: result.diagnostic.column,
    },
  };
}

export function addSymbolNodes(graph, root) {
  const files = Object.values(graph.nodes)
    .filter((node) => node.type === "file" && supportsJavaScript(node.path))
    .sort((a, b) => compareText(a.path, b.path));

  for (const fileNode of files) {
    if (fileNode.meta?.symlink) continue;
    const source = fs.readFileSync(absolutePath(root, fileNode.path), "utf8");
    const result = extractJavaScriptSymbols(source, fileNode.path);
    fileNode.meta = {
      ...(fileNode.meta ?? {}),
      symbols: parseStatusMeta(result),
    };
    if (result.diagnostic.status !== "ok") continue;

    const actualIds = new Map();
    for (const symbol of result.symbols) {
      const parentId = symbol.parent_key ? actualIds.get(symbol.parent_key) : fileNode.id;
      if (!parentId) throw new Error(`symbol parent was not emitted before child: ${symbol.qualified_name}`);
      const identity = uniqueIdentity(graph, symbol.type, fileNode.path, symbol.qualified_name, symbol.source);
      addNode(graph, {
        id: identity.id,
        type: symbol.type,
        path: fileNode.path,
        qualified_name: identity.qualifiedName,
        parent_id: parentId,
        source: symbol.source,
        meta: {
          ...symbol.meta,
          symbol_name: symbol.name,
        },
      });
      addEdge(graph, { type: "contains", from: parentId, to: identity.id });
      actualIds.set(symbol.key, identity.id);
    }
  }

  graph.edges.sort((a, b) =>
    compareText(a.type, b.type) || compareText(a.from, b.from) || compareText(a.to, b.to)
  );
  return graph;
}
