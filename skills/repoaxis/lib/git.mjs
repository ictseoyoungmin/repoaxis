import { execFileSync } from "node:child_process";
import path from "node:path";

function git(root, args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const detail = error?.stderr?.toString?.().trim();
    throw new Error(detail || `git ${args.join(" ")} failed`);
  }
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
