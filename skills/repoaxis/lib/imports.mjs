import fs from "node:fs";
import path from "node:path";
import { addEdge } from "./graph.mjs";
import { extractJavaScriptImports, JAVASCRIPT_PARSER, supportsJavaScript } from "./languages/javascript.mjs";

const RESOLUTION_EXTENSIONS = [".js", ".mjs", ".cjs", ".json"];

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function absolutePath(root, repoPath) {
  return path.join(root, ...repoPath.split("/"));
}

function normalizeCandidate(value) {
  const normalized = path.posix.normalize(value).replace(/^\.\//, "");
  if (normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function candidatePaths(importerPath, specifier) {
  if (!specifier.startsWith(".")) return [];
  const base = normalizeCandidate(path.posix.join(path.posix.dirname(importerPath), specifier));
  if (!base) return [];
  const candidates = [base];
  if (!path.posix.extname(base)) {
    for (const ext of RESOLUTION_EXTENSIONS) candidates.push(`${base}${ext}`);
    for (const ext of RESOLUTION_EXTENSIONS) candidates.push(path.posix.join(base, `index${ext}`));
  }
  return [...new Set(candidates)];
}

function resolveImport(importerPath, specifier, fileIdsByPath) {
  if (!specifier.startsWith(".")) return { status: "external", targetId: null, targetPath: null };
  for (const candidate of candidatePaths(importerPath, specifier)) {
    const targetId = fileIdsByPath.get(candidate);
    if (targetId) return { status: "resolved", targetId, targetPath: candidate };
  }
  return { status: "unresolved", targetId: null, targetPath: null };
}

function summarizeImports(result, resolvedSpecifiers, externalSpecifiers, unresolvedSpecifiers, resolvedTargets = 0) {
  if (result.diagnostic.status !== "ok") {
    return {
      language: "javascript",
      parser: JAVASCRIPT_PARSER.name,
      parser_version: JAVASCRIPT_PARSER.version,
      status: "error",
      count: 0,
      resolved_local: 0,
      resolved_targets: 0,
      external: 0,
      external_specifiers: [],
      unresolved: 0,
      unresolved_specifiers: [],
      error: {
        message: result.diagnostic.message,
        line: result.diagnostic.line,
        column: result.diagnostic.column,
      },
    };
  }
  return {
    language: "javascript",
    parser: JAVASCRIPT_PARSER.name,
    parser_version: JAVASCRIPT_PARSER.version,
    status: "ok",
    count: result.imports.length,
    resolved_local: resolvedSpecifiers.length,
    resolved_targets: resolvedTargets,
    external: externalSpecifiers.length,
    external_specifiers: [...new Set(externalSpecifiers)].sort(compareText),
    unresolved: unresolvedSpecifiers.length,
    unresolved_specifiers: [...new Set(unresolvedSpecifiers)].sort(compareText),
  };
}

export function addImportEdges(graph, root) {
  const fileNodes = Object.values(graph.nodes)
    .filter((node) => node.type === "file")
    .sort((a, b) => compareText(a.path, b.path));
  const fileIdsByPath = new Map(fileNodes.map((node) => [node.path, node.id]));

  for (const fileNode of fileNodes) {
    if (!supportsJavaScript(fileNode.path) || fileNode.meta?.symlink) continue;
    const source = fs.readFileSync(absolutePath(root, fileNode.path), "utf8");
    const result = extractJavaScriptImports(source, fileNode.path);
    if (result.diagnostic.status !== "ok") {
      fileNode.meta = { ...(fileNode.meta ?? {}), imports: summarizeImports(result, [], [], [], 0) };
      continue;
    }

    const grouped = new Map();
    const resolvedSpecifiers = [];
    const externalSpecifiers = [];
    const unresolvedSpecifiers = [];

    for (const record of result.imports) {
      const resolution = resolveImport(fileNode.path, record.specifier, fileIdsByPath);
      if (resolution.status === "external") {
        externalSpecifiers.push(record.specifier);
        continue;
      }
      if (resolution.status === "unresolved") {
        unresolvedSpecifiers.push(record.specifier);
        continue;
      }
      resolvedSpecifiers.push(record.specifier);
      const existing = grouped.get(resolution.targetId) ?? {
        specifiers: new Set(),
        kinds: new Set(),
      };
      existing.specifiers.add(record.specifier);
      existing.kinds.add(record.kind);
      grouped.set(resolution.targetId, existing);
    }

    fileNode.meta = { ...(fileNode.meta ?? {}), imports: summarizeImports(result, resolvedSpecifiers, externalSpecifiers, unresolvedSpecifiers, grouped.size) };

    for (const targetId of [...grouped.keys()].sort(compareText)) {
      const info = grouped.get(targetId);
      addEdge(graph, {
        type: "imports",
        from: fileNode.id,
        to: targetId,
        meta: {
          specifiers: [...info.specifiers].sort(compareText),
          kinds: [...info.kinds].sort(compareText),
        },
      });
    }
  }

  graph.edges.sort((a, b) =>
    compareText(a.type, b.type) || compareText(a.from, b.from) || compareText(a.to, b.to)
  );
  return graph;
}
