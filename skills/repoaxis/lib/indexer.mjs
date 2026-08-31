import fs from "node:fs";
import path from "node:path";
import { readPreservedAnnotations } from "./annotations.mjs";
import { buildFilesystemGraph } from "./filesystem.mjs";
import { readHead, resolveGitRoot } from "./git.mjs";
import { createRefreshRecord } from "./refresh.mjs";
import { stableStringify } from "./stable-json.mjs";

export const REPOAXIS_VERSION = "0.2.0";

export function createIndex(root, { reason = "manual", annotations = {}, excludePaths = [] } = {}) {
  const head = readHead(root);
  const graph = buildFilesystemGraph(root, { excludePaths });
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
  const relativeOutput = path.relative(gitRoot, outputPath);
  const outputInsideRepository = relativeOutput && !relativeOutput.startsWith(`..${path.sep}`) && relativeOutput !== ".." && !path.isAbsolute(relativeOutput);
  const excludePaths = outputInsideRepository ? [relativeOutput.replaceAll(path.sep, "/")] : [];
  const index = createIndex(gitRoot, { reason, annotations, excludePaths });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stableStringify(index), "utf8");
  return { root: gitRoot, output: outputPath, index };
}
