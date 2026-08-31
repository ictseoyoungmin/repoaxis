import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";
import { readOperationalIndex } from "../../../skills/repoaxis/lib/fresh-index.mjs";

const CLI = fileURLToPath(new URL("../../../skills/repoaxis/scripts/cli.mjs", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-refresh-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "config.js"), "export const value = 'aa';\n", "utf8");
  git(root, "init");
  git(root, "config", "user.email", "repoaxis@example.test");
  git(root, "config", "user.name", "Repoaxis Test");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  return root;
}

function readIndex(root) {
  return JSON.parse(fs.readFileSync(path.join(root, ".repoaxis.json"), "utf8"));
}

test("query-time refresh follows HEAD, dirty content, staged blobs, and explicit snapshot mode", () => {
  const root = createRepo();
  const indexFile = path.join(root, ".repoaxis.json");

  let state = readOperationalIndex({ cwd: root });
  assert.equal(state.refreshed, true);
  assert.equal(state.reason, "index-missing");
  assert.match(state.index.generated.refresh.fingerprint, /^sha256:/);

  state = readOperationalIndex({ cwd: root });
  assert.equal(state.refreshed, false);
  assert.equal(state.reason, "fresh");

  fs.writeFileSync(path.join(root, "src", "config.js"), "export const value = 'bb';\n", "utf8");
  state = readOperationalIndex({ cwd: root });
  assert.equal(state.reason, "working-tree-changed");
  assert.equal(state.index.generated.nodes["file:src/config.js"].git.working, "modified");

  const firstDirtyFingerprint = state.index.generated.refresh.fingerprint;
  fs.writeFileSync(path.join(root, "src", "config.js"), "export const value = 'cc';\n", "utf8");
  state = readOperationalIndex({ cwd: root });
  assert.equal(state.reason, "working-tree-changed");
  assert.notEqual(state.index.generated.refresh.fingerprint, firstDirtyFingerprint);

  git(root, "add", "src/config.js");
  state = readOperationalIndex({ cwd: root });
  const firstStagedFingerprint = state.index.generated.refresh.fingerprint;
  fs.writeFileSync(path.join(root, "src", "config.js"), "export const value = 'dd';\n", "utf8");
  git(root, "add", "src/config.js");
  state = readOperationalIndex({ cwd: root });
  assert.equal(state.reason, "working-tree-changed");
  assert.notEqual(state.index.generated.refresh.fingerprint, firstStagedFingerprint);

  git(root, "commit", "-m", "update config");
  state = readOperationalIndex({ cwd: root });
  assert.equal(state.reason, "head-changed");
  assert.equal(state.index.repository.head_sha, git(root, "rev-parse", "HEAD"));

  const snapshot = path.join(root, "snapshot.json");
  fs.copyFileSync(indexFile, snapshot);
  fs.writeFileSync(path.join(root, "src", "config.js"), "export const value = 'ee';\n", "utf8");
  state = readOperationalIndex({ cwd: root, fileArg: snapshot });
  assert.equal(state.refreshed, false);
  assert.equal(state.reason, "explicit-snapshot");
  assert.equal(state.index.generated.refresh.reason, "query:head-changed");

  const output = JSON.parse(execFileSync(process.execPath, [CLI, "changed"], { cwd: root, encoding: "utf8" }));
  assert.equal(output.count, 1);
  assert.equal(readIndex(root).generated.refresh.reason, "query:working-tree-changed");
});

test("manual builds preserve annotations and do not become stale because of their own output", () => {
  const root = createRepo();
  const indexFile = path.join(root, ".repoaxis.json");
  buildIndex({ root });
  const first = fs.readFileSync(indexFile, "utf8");
  buildIndex({ root });
  const second = fs.readFileSync(indexFile, "utf8");
  assert.equal(first, second);
  assert.equal(readOperationalIndex({ cwd: root }).refreshed, false);
});
