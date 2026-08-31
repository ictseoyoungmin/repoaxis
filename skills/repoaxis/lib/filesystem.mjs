import fs from "node:fs";
import path from "node:path";
import { addEdge, addNode, createEmptyGraph } from "./graph.mjs";
import { listWorkingTreeFiles } from "./git.mjs";
import { makeNodeId, normalizeRepoPath } from "./node-id.mjs";

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function repoPathParent(repoPath) {
  const normalized = normalizeRepoPath(repoPath);
  if (normalized === ".") return null;
  const parent = path.posix.dirname(normalized);
  return parent === "." ? "." : normalizeRepoPath(parent);
}

function extensionFor(repoPath) {
  const ext = path.posix.extname(repoPath);
  return ext || null;
}

function fileMeta(root, repoPath) {
  const absolute = path.join(root, ...repoPath.split("/"));
  const stat = fs.lstatSync(absolute);
  return {
    size_bytes: stat.size,
    extension: extensionFor(repoPath),
    symlink: stat.isSymbolicLink(),
  };
}

function folderPathsFor(files) {
  const folders = new Set(["."]);
  for (const file of files) {
    let current = repoPathParent(file);
    while (current) {
      folders.add(current);
      if (current === ".") break;
      current = repoPathParent(current);
    }
  }
  return [...folders].sort((a, b) => {
    const depthA = a === "." ? 0 : a.split("/").length;
    const depthB = b === "." ? 0 : b.split("/").length;
    return depthA - depthB || compareText(a, b);
  });
}

export function buildFilesystemGraph(root, { excludePaths = [] } = {}) {
  const excluded = new Set(excludePaths.map((value) => normalizeRepoPath(value)));
  const files = listWorkingTreeFiles(root).filter((repoPath) => !excluded.has(repoPath));
  const folders = folderPathsFor(files);
  const graph = createEmptyGraph();

  for (const folder of folders) {
    const id = makeNodeId("folder", folder);
    addNode(graph, { id, type: "folder", path: folder });
  }

  for (const file of files) {
    const id = makeNodeId("file", file);
    addNode(graph, {
      id,
      type: "file",
      path: file,
      meta: fileMeta(root, file),
    });
  }

  for (const folder of folders) {
    if (folder === ".") continue;
    const parent = repoPathParent(folder);
    addEdge(graph, {
      type: "contains",
      from: makeNodeId("folder", parent),
      to: makeNodeId("folder", folder),
    });
  }

  for (const file of files) {
    const parent = repoPathParent(file);
    addEdge(graph, {
      type: "contains",
      from: makeNodeId("folder", parent),
      to: makeNodeId("file", file),
    });
  }

  graph.edges.sort((a, b) =>
    compareText(a.type, b.type) || compareText(a.from, b.from) || compareText(a.to, b.to)
  );

  return graph;
}
