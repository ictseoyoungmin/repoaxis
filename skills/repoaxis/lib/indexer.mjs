import fs from "node:fs";
import path from "node:path";
import { readPreservedAnnotations } from "./annotations.mjs";
import { buildFilesystemGraph } from "./filesystem.mjs";
import { addSymbolNodes } from "./symbols.mjs";
import { addImportEdges } from "./imports.mjs";
import { attachGitState } from "./git-state.mjs";
import { attachGitContext } from "./git-context.mjs";
import { readHead, resolveGitRoot } from "./git.mjs";
import { computeRepositoryFingerprint, createRefreshRecord } from "./refresh.mjs";
import { stableStringify } from "./stable-json.mjs";

export const REPOAXIS_VERSION = "0.12.2";

function writeIndexAtomic(outputPath, index) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const temp = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.tmp-${process.pid}-${Date.now()}`);
  const mode = fs.existsSync(outputPath) ? fs.statSync(outputPath).mode : 0o666;
  try {
    fs.writeFileSync(temp, stableStringify(index), { encoding: "utf8", mode });
    fs.renameSync(temp, outputPath);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

export function createIndex(root, { reason = "manual", annotations = {}, excludePaths = [] } = {}) {
  const head = readHead(root);
  const graph = buildFilesystemGraph(root, { excludePaths });
  addSymbolNodes(graph, root);
  addImportEdges(graph, root);
  const gitChanges = attachGitState(graph, root, { excludePaths });
  attachGitContext(graph, root);
  const fingerprint = computeRepositoryFingerprint(root, { excludePaths });
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
      git_changes: gitChanges,
      refresh: createRefreshRecord(reason, { fingerprint }),
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
  writeIndexAtomic(outputPath, index);
  return { root: gitRoot, output: outputPath, index };
}
