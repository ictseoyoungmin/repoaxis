import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";
import { readWorkingTreeState } from "../../../skills/repoaxis/lib/git.mjs";
import { validateIndex } from "../../../skills/repoaxis/lib/schema.mjs";

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function createRepository() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-git-state-"));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Repoaxis Test");
  git(dir, "config", "user.email", "repoaxis@example.invalid");
  return dir;
}

function commitAll(root, message = "fixture") {
  git(root, "add", ".");
  git(root, "commit", "-qm", message);
}

test("Git status distinguishes working, staged, deleted, renamed, and untracked state", () => {
  const dir = createRepository();
  for (const [name, value] of Object.entries({
    "clean.txt": "clean",
    "mod.txt": "one",
    "stage.txt": "one",
    "delete.txt": "one",
    "rename.txt": "one",
  })) fs.writeFileSync(path.join(dir, name), value);
  commitAll(dir);

  fs.writeFileSync(path.join(dir, "mod.txt"), "two");
  fs.writeFileSync(path.join(dir, "stage.txt"), "two");
  git(dir, "add", "stage.txt");
  fs.unlinkSync(path.join(dir, "delete.txt"));
  git(dir, "mv", "rename.txt", "renamed file.txt");
  fs.writeFileSync(path.join(dir, "new file.txt"), "new");

  assert.deepEqual(readWorkingTreeState(dir), [
    { path: "delete.txt", tracked: true, working: "deleted", staged: false, conflicted: false },
    { path: "mod.txt", tracked: true, working: "modified", staged: false, conflicted: false },
    { path: "new file.txt", tracked: false, working: "untracked", staged: false, conflicted: false },
    { path: "renamed file.txt", tracked: true, working: "clean", staged: "renamed", conflicted: false, rename_from: "rename.txt", similarity: 100 },
    { path: "stage.txt", tracked: true, working: "clean", staged: "modified", conflicted: false },
  ]);
});

test("Git status preserves mixed staged and working changes", () => {
  const dir = createRepository();
  fs.writeFileSync(path.join(dir, "mixed.txt"), "one");
  commitAll(dir);
  fs.writeFileSync(path.join(dir, "mixed.txt"), "two");
  git(dir, "add", "mixed.txt");
  fs.writeFileSync(path.join(dir, "mixed.txt"), "three");

  assert.deepEqual(readWorkingTreeState(dir), [
    { path: "mixed.txt", tracked: true, working: "modified", staged: "modified", conflicted: false },
  ]);
});

test("Git status preserves unmerged conflict state", () => {
  const dir = createRepository();
  fs.writeFileSync(path.join(dir, "conflict.txt"), "base\n");
  commitAll(dir);
  git(dir, "checkout", "-qb", "side");
  fs.writeFileSync(path.join(dir, "conflict.txt"), "side\n");
  commitAll(dir, "side");
  git(dir, "checkout", "-q", "main");
  fs.writeFileSync(path.join(dir, "conflict.txt"), "main\n");
  commitAll(dir, "main");
  try { git(dir, "merge", "side"); } catch {}

  assert.deepEqual(readWorkingTreeState(dir), [
    { path: "conflict.txt", tracked: true, working: "conflicted", staged: "conflicted", conflicted: true, conflict_code: "UU" },
  ]);
});

test("build attaches exact file Git state and keeps absent deletions in git_changes", () => {
  const dir = createRepository();
  fs.writeFileSync(path.join(dir, "clean.txt"), "clean");
  fs.writeFileSync(path.join(dir, "gone.txt"), "gone");
  commitAll(dir);
  fs.unlinkSync(path.join(dir, "gone.txt"));
  fs.writeFileSync(path.join(dir, "new.txt"), "new");

  const first = buildIndex({ root: dir });
  const firstBytes = fs.readFileSync(first.output, "utf8");
  const second = buildIndex({ root: dir });
  const secondBytes = fs.readFileSync(second.output, "utf8");

  assert.equal(validateIndex(second.index).ok, true);
  assert.equal(firstBytes, secondBytes);
  assert.deepEqual(second.index.generated.nodes["file:clean.txt"].git, {
    tracked: true,
    working: "clean",
    staged: false,
    conflicted: false,
  });
  assert.deepEqual(second.index.generated.nodes["file:new.txt"].git, {
    tracked: false,
    working: "untracked",
    staged: false,
    conflicted: false,
  });
  assert.equal(Boolean(second.index.generated.nodes["file:gone.txt"]), false);
  assert.deepEqual(second.index.generated.git_changes.map((entry) => entry.path), ["gone.txt", "new.txt"]);
  assert.equal(second.index.generated.git_changes.some((entry) => entry.path === ".repoaxis.json"), false);
});
