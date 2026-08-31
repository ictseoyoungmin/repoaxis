import fs from "node:fs";
import path from "node:path";
import { readPreservedAnnotations } from "./annotations.mjs";
import { createEmptyGraph } from "./graph.mjs";
import { readHead, resolveGitRoot } from "./git.mjs";
import { createRefreshRecord } from "./refresh.mjs";
import { stableStringify } from "./stable-json.mjs";

export const REPOAXIS_VERSION = "0.1.0";

export function createBootstrapIndex(root, { reason = "manual", annotations = {} } = {}) {
  const head = readHead(root);
  const graph = createEmptyGraph();
  return {
    schema_version: 1,
    tool: { name: "repoaxis", version: REPOAXIS_VERSION },
    authority: "git+working-tree",
    repository: {
      root: ".",
      head_sha: head.sha,
      head_ref: head.ref,
    },
    generated: {
      nodes: graph.nodes,
      edges: graph.edges,
      refresh: createRefreshRecord(reason),
    },
    annotations,
  };
}

export function buildIndex({ root = process.cwd(), output = null, reason = "manual" } = {}) {
  const gitRoot = resolveGitRoot(root);
  const outputPath = path.resolve(output ?? path.join(gitRoot, ".repoaxis.json"));
  const annotations = readPreservedAnnotations(outputPath);
  const index = createBootstrapIndex(gitRoot, { reason, annotations });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stableStringify(index), "utf8");
  return { root: gitRoot, output: outputPath, index };
}
