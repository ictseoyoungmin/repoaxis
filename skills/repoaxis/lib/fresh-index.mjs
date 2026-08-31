import fs from "node:fs";
import path from "node:path";
import { buildIndex, REPOAXIS_VERSION } from "./indexer.mjs";
import { readHead, resolveGitRoot } from "./git.mjs";
import { assessIndexFreshness, computeRepositoryFingerprint } from "./refresh.mjs";
import { validateIndex } from "./schema.mjs";

function readValidated(file) {
  const index = JSON.parse(fs.readFileSync(file, "utf8"));
  const validation = validateIndex(index);
  if (!validation.ok) throw new Error(`invalid index: ${validation.errors.join("; ")}`);
  return index;
}

function relativeOutputExclusion(root, file) {
  const relative = path.relative(root, file);
  const inside = relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
  return inside ? [relative.replaceAll(path.sep, "/")] : [];
}

export function readOperationalIndex({ fileArg = null, cwd = process.cwd() } = {}) {
  if (fileArg) {
    const file = path.resolve(fileArg);
    return { file, index: readValidated(file), refreshed: false, reason: "explicit-snapshot" };
  }

  const root = resolveGitRoot(cwd);
  const file = path.join(root, ".repoaxis.json");
  if (!fs.existsSync(file)) {
    const built = buildIndex({ root, output: file, reason: "query:index-missing" });
    return { file, index: built.index, refreshed: true, reason: "index-missing" };
  }

  const index = readValidated(file);
  const excludePaths = relativeOutputExclusion(root, file);
  const head = readHead(root);
  const fingerprint = computeRepositoryFingerprint(root, { excludePaths });
  const freshness = assessIndexFreshness(index, { fingerprint, head, toolVersion: REPOAXIS_VERSION });
  if (freshness.fresh) return { file, index, refreshed: false, reason: "fresh" };

  const built = buildIndex({ root, output: file, reason: `query:${freshness.reason}` });
  return { file, index: built.index, refreshed: true, reason: freshness.reason };
}
