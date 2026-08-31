import { readLastFileCommit } from "./git.mjs";

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function attachGitContext(graph, root) {
  const files = Object.values(graph.nodes)
    .filter((node) => node.type === "file")
    .sort((a, b) => compareText(a.path, b.path));

  for (const fileNode of files) {
    if (!fileNode.git) continue;
    fileNode.git.last_commit = fileNode.git.tracked
      ? readLastFileCommit(root, fileNode.path)
      : null;
  }

  return graph;
}
