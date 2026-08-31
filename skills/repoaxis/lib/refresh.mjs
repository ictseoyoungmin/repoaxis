import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readHead, readWorkingTreeState } from "./git.mjs";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function excludedSet(excludePaths) {
  return new Set((excludePaths ?? []).map((value) => value.replaceAll("\\", "/")));
}

function worktreeHash(root, repoPath) {
  const absolute = path.join(root, ...repoPath.split("/"));
  try {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return `symlink:${sha256(fs.readlinkSync(absolute))}`;
    if (stat.isFile()) return `file:${sha256(fs.readFileSync(absolute))}`;
    if (stat.isDirectory()) return "directory";
    return `other:${stat.mode}`;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function indexStateHash(root, repoPath) {
  const output = execFileSync("git", ["-C", root, "ls-files", "-s", "-z", "--", repoPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return `sha256:${sha256(output)}`;
}

export function computeRepositoryFingerprint(root, { excludePaths = [] } = {}) {
  const excluded = excludedSet(excludePaths);
  const head = readHead(root);
  const changes = readWorkingTreeState(root)
    .filter((entry) => !excluded.has(entry.path))
    .map((entry) => {
      const record = {
        ...entry,
        worktree_hash: worktreeHash(root, entry.path),
      };
      if (entry.tracked && (entry.staged !== false || entry.conflicted)) {
        record.index_hash = indexStateHash(root, entry.path);
      }
      return record;
    });
  const payload = JSON.stringify({
    head_sha: head.sha,
    head_ref: head.ref,
    changes,
  });
  return `sha256:${sha256(payload)}`;
}

export function createRefreshRecord(reason = "manual", { fingerprint = null } = {}) {
  if (typeof reason !== "string" || !reason.trim()) {
    throw new TypeError("refresh reason must be a non-empty string");
  }
  const record = { reason: reason.trim() };
  if (fingerprint != null) {
    if (typeof fingerprint !== "string" || !fingerprint.startsWith("sha256:")) {
      throw new TypeError("refresh fingerprint must be a sha256 string");
    }
    record.fingerprint = fingerprint;
  }
  return record;
}

export function assessIndexFreshness(index, { fingerprint, head, toolVersion }) {
  if (!index) return { fresh: false, reason: "index-missing" };
  if (index.tool?.version !== toolVersion) return { fresh: false, reason: "tool-version-changed" };
  if (index.repository?.head_sha !== head.sha) return { fresh: false, reason: "head-changed" };
  if (index.repository?.head_ref !== head.ref) return { fresh: false, reason: "head-ref-changed" };
  const recorded = index.generated?.refresh?.fingerprint;
  if (typeof recorded !== "string") return { fresh: false, reason: "fingerprint-missing" };
  if (recorded !== fingerprint) return { fresh: false, reason: "working-tree-changed" };
  return { fresh: true, reason: "fresh" };
}
