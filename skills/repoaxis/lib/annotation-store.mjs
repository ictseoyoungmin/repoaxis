import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { resolveGitRoot } from "./git.mjs";
import { stableStringify } from "./stable-json.mjs";

function gitPath(root, repoRelativePath) {
  const output = execFileSync("git", ["-C", root, "rev-parse", "--git-path", repoRelativePath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  return path.isAbsolute(output) ? output : path.resolve(root, output);
}

export function repositoryRootForDefaultIndex(filePath) {
  const absolute = path.resolve(filePath);
  try {
    const root = resolveGitRoot(path.dirname(absolute));
    return absolute === path.join(root, ".repoaxis.json") ? root : null;
  } catch {
    return null;
  }
}

export function annotationStorePath(root) {
  return gitPath(root, "repoaxis/annotations.json");
}

export function readDurableAnnotations(root) {
  const file = annotationStorePath(root);
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed?.annotations && typeof parsed.annotations === "object" && !Array.isArray(parsed.annotations)
      ? parsed.annotations
      : {};
  } catch {
    return {};
  }
}

export function writeDurableAnnotations(root, annotations) {
  const file = annotationStorePath(root);
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true });
  const temp = path.join(directory, `.annotations.json.tmp-${process.pid}-${Date.now()}`);
  const body = stableStringify({ version: 1, annotations });
  try {
    fs.writeFileSync(temp, body, "utf8");
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  return file;
}
