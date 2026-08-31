import { compactNode, importedBy } from "./query.mjs";

const JAVASCRIPT_FILE = /\.(?:[cm]?js)$/i;

export function unreferencedCandidates(index) {
  const annotations = index?.annotations ?? {};
  const candidates = Object.values(index?.generated?.nodes ?? {})
    .filter((node) => node.type === "file" && JAVASCRIPT_FILE.test(node.path))
    .filter((node) => importedBy(index, node.id).length === 0)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    .map((node) => ({
      node: compactNode(node),
      annotation: annotations[node.id] ?? null,
    }));

  return {
    basis: "no-incoming-repository-imports",
    caution: "Candidates are not dead-code findings. Runtime, CLI, framework, configuration, migration, fixture, or plugin entry paths may still require them.",
    count: candidates.length,
    candidates,
  };
}
