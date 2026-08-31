import { readWorkingTreeState } from "./git.mjs";

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cleanState() {
  return { tracked: true, working: "clean", staged: false, conflicted: false };
}

function publicState(entry) {
  const state = {
    tracked: entry.tracked,
    working: entry.working,
    staged: entry.staged,
    conflicted: entry.conflicted,
  };
  if (entry.rename_from) state.rename_from = entry.rename_from;
  if (entry.copy_from) state.copy_from = entry.copy_from;
  if (entry.similarity != null) state.similarity = entry.similarity;
  if (entry.conflict_code) state.conflict_code = entry.conflict_code;
  return state;
}

export function attachGitState(graph, root, { excludePaths = [] } = {}) {
  const excluded = new Set(excludePaths);
  const entries = readWorkingTreeState(root).filter((entry) => !excluded.has(entry.path));
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));

  for (const node of Object.values(graph.nodes)) {
    if (node.type !== "file") continue;
    const entry = byPath.get(node.path);
    node.git = entry ? publicState(entry) : cleanState();
  }

  return entries
    .map((entry) => ({ path: entry.path, ...publicState(entry) }))
    .sort((a, b) => compareText(a.path, b.path));
}
