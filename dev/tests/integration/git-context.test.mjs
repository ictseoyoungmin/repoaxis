import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildIndex, REPOAXIS_VERSION } from "../../../skills/repoaxis/lib/indexer.mjs";
import { validateIndex } from "../../../skills/repoaxis/lib/schema.mjs";

function git(root, args, env = {}) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function write(root, repoPath, content) {
  const absolute = path.join(root, ...repoPath.split("/"));
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-git-context-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Repoaxis Test"]);
  git(root, ["config", "user.email", "repoaxis@example.com"]);
  return root;
}

test("build attaches exact last commit to current tracked file paths", () => {
  const root = makeRepo();
  write(root, "a.txt", "a\n");
  write(root, "b.txt", "b\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "initial files"], {
    GIT_AUTHOR_DATE: "2026-08-30T10:00:00+09:00",
    GIT_COMMITTER_DATE: "2026-08-30T10:00:00+09:00",
  });
  const initialSha = git(root, ["rev-parse", "HEAD"]);

  write(root, "a.txt", "a\ncommitted update\n");
  git(root, ["add", "a.txt"]);
  git(root, ["commit", "-qm", "update a"], {
    GIT_AUTHOR_DATE: "2026-08-31T11:00:00+09:00",
    GIT_COMMITTER_DATE: "2026-08-31T11:00:00+09:00",
  });
  const updateSha = git(root, ["rev-parse", "HEAD"]);

  fs.appendFileSync(path.join(root, "a.txt"), "working edit\n", "utf8");
  write(root, "new.txt", "new\n");
  git(root, ["add", "new.txt"]);
  write(root, "untracked.txt", "untracked\n");

  const first = buildIndex({ root }).index;
  assert.equal(first.tool.version, REPOAXIS_VERSION);
  assert.deepEqual(first.generated.nodes["file:a.txt"].git.last_commit, {
    sha: updateSha,
    author_name: "Repoaxis Test",
    authored_at: "2026-08-31T11:00:00+09:00",
    committed_at: "2026-08-31T11:00:00+09:00",
    subject: "update a",
  });
  assert.deepEqual(first.generated.nodes["file:b.txt"].git.last_commit, {
    sha: initialSha,
    author_name: "Repoaxis Test",
    authored_at: "2026-08-30T10:00:00+09:00",
    committed_at: "2026-08-30T10:00:00+09:00",
    subject: "initial files",
  });
  assert.equal(first.generated.nodes["file:new.txt"].git.tracked, true);
  assert.equal(first.generated.nodes["file:new.txt"].git.staged, "added");
  assert.equal(first.generated.nodes["file:new.txt"].git.last_commit, null);
  assert.equal(first.generated.nodes["file:untracked.txt"].git.tracked, false);
  assert.equal(first.generated.nodes["file:untracked.txt"].git.last_commit, null);
  assert.equal(validateIndex(first).ok, true);

  const before = fs.readFileSync(path.join(root, ".repoaxis.json"), "utf8");
  buildIndex({ root });
  const after = fs.readFileSync(path.join(root, ".repoaxis.json"), "utf8");
  assert.equal(after, before);
});

test("current-path semantics do not invent history for an uncommitted rename", () => {
  const root = makeRepo();
  write(root, "old.txt", "old\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "add old"]);
  git(root, ["mv", "old.txt", "new-name.txt"]);

  const index = buildIndex({ root }).index;
  const node = index.generated.nodes["file:new-name.txt"];
  assert.equal(node.git.staged, "renamed");
  assert.equal(node.git.rename_from, "old.txt");
  assert.equal(node.git.last_commit, null);
  assert.equal(validateIndex(index).ok, true);
});
