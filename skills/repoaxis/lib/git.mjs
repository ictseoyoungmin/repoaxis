import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function git(root, args, { allowFailure = false, trim = true } = {}) {
  try {
    const output = execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return trim ? output.trim() : output;
  } catch (error) {
    if (allowFailure) return null;
    const detail = error?.stderr?.toString?.().trim();
    throw new Error(detail || `git ${args.join(" ")} failed`);
  }
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function splitPrefix(record, tokenCount) {
  const tokens = [];
  let start = 0;
  for (let i = 0; i < tokenCount; i += 1) {
    const space = record.indexOf(" ", start);
    if (space < 0) throw new Error(`malformed Git status record: ${record}`);
    tokens.push(record.slice(start, space));
    start = space + 1;
  }
  return { tokens, rest: record.slice(start) };
}

function stateForCode(code) {
  switch (code) {
    case ".": return null;
    case "M": return "modified";
    case "T": return "type-changed";
    case "A": return "added";
    case "D": return "deleted";
    case "R": return "renamed";
    case "C": return "copied";
    case "U": return "conflicted";
    default: throw new Error(`unsupported Git status code: ${code}`);
  }
}

function similarityValue(token) {
  const value = Number.parseInt(token?.slice(1) ?? "", 10);
  return Number.isInteger(value) ? value : null;
}

export function parseStatusPorcelainV2(output) {
  const records = output.split("\0");
  const entries = [];
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    if (!record || record.startsWith("# ") || record.startsWith("! ")) continue;
    if (record.startsWith("? ")) {
      entries.push({ path: record.slice(2), tracked: false, working: "untracked", staged: false, conflicted: false });
      continue;
    }
    if (record.startsWith("1 ")) {
      const { tokens, rest: repoPath } = splitPrefix(record, 8);
      const xy = tokens[1];
      entries.push({ path: repoPath, tracked: true, working: stateForCode(xy[1]) ?? "clean", staged: stateForCode(xy[0]) ?? false, conflicted: false });
      continue;
    }
    if (record.startsWith("2 ")) {
      const { tokens, rest: repoPath } = splitPrefix(record, 9);
      const xy = tokens[1];
      const score = tokens[8];
      const originalPath = records[i + 1] ?? "";
      i += 1;
      const relation = score.startsWith("C") ? "copy_from" : "rename_from";
      entries.push({
        path: repoPath,
        tracked: true,
        working: stateForCode(xy[1]) ?? "clean",
        staged: stateForCode(xy[0]) ?? false,
        conflicted: false,
        [relation]: originalPath,
        similarity: similarityValue(score),
      });
      continue;
    }
    if (record.startsWith("u ")) {
      const { tokens, rest: repoPath } = splitPrefix(record, 10);
      entries.push({ path: repoPath, tracked: true, working: "conflicted", staged: "conflicted", conflicted: true, conflict_code: tokens[1] });
      continue;
    }
    throw new Error(`unsupported Git status record: ${record}`);
  }
  return entries.sort((a, b) => compareText(a.path, b.path));
}

export function resolveGitRoot(inputRoot = process.cwd()) {
  const candidate = path.resolve(inputRoot);
  const root = git(candidate, ["rev-parse", "--show-toplevel"], { allowFailure: true });
  if (!root) throw new Error(`not inside a Git repository: ${candidate}`);
  return path.resolve(root);
}

export function readHead(root) {
  const sha = git(root, ["rev-parse", "HEAD"], { allowFailure: true });
  const ref = git(root, ["symbolic-ref", "--short", "-q", "HEAD"], { allowFailure: true });
  return { sha, ref };
}

export function gitVersion() {
  return execFileSync("git", ["--version"], { encoding: "utf8" }).trim();
}

export function listWorkingTreeFiles(root) {
  const output = git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]) ?? "";
  const files = output
    .split("\0")
    .filter(Boolean)
    .filter((repoPath) => {
      const absolute = path.join(root, ...repoPath.split("/"));
      try {
        const stat = fs.lstatSync(absolute);
        return stat.isFile() || stat.isSymbolicLink();
      } catch {
        return false;
      }
    });
  return [...new Set(files)].sort();
}

export function readWorkingTreeState(root) {
  const output = git(root, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--find-renames=50%"], { trim: false }) ?? "";
  return parseStatusPorcelainV2(output);
}
