import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { clearAnnotation, readAnnotationIndex, setAnnotation } from "../../../skills/repoaxis/lib/annotations.mjs";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";

const CLI = fileURLToPath(new URL("../../../skills/repoaxis/scripts/cli.mjs", import.meta.url));

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function runCli(indexFile, ...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args, "--index", indexFile], { encoding: "utf8" }));
}

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-annotations-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "config.js"), "export function parseConfig(input) { return input; }\n", "utf8");
  git(root, "init");
  git(root, "config", "user.email", "repoaxis@example.test");
  git(root, "config", "user.name", "Repoaxis Test");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial fixture");
  return root;
}

test("annotations survive rebuild, become manageable orphans, and clear explicitly", () => {
  const root = createRepo();
  const indexFile = path.join(root, ".repoaxis.json");

  buildIndex({ root });
  const written = setAnnotation(indexFile, "src/config.js:parseConfig", "  Runtime configuration boundary.  ");
  assert.equal(written.target_id, "function:src/config.js::parseConfig");
  assert.equal(written.annotation.agent_note, "Runtime configuration boundary.");
  assert.equal(fs.readdirSync(root).some((name) => name.includes(".repoaxis.json.tmp-")), false);

  buildIndex({ root, reason: "annotation-preservation-test" });
  let { index } = readAnnotationIndex(indexFile);
  assert.equal(index.annotations[written.target_id].agent_note, "Runtime configuration boundary.");

  const read = runCli(indexFile, "note", "src/config.js:parseConfig");
  assert.equal(read.orphaned, false);
  assert.equal(read.annotation.agent_note, "Runtime configuration boundary.");
  const listed = runCli(indexFile, "notes");
  assert.equal(listed.count, 1);
  assert.equal(listed.annotations[0].orphaned, false);

  fs.unlinkSync(path.join(root, "src", "config.js"));
  buildIndex({ root, reason: "source-removed" });
  ({ index } = readAnnotationIndex(indexFile));
  assert.equal(Boolean(index.generated.nodes[written.target_id]), false);
  assert.equal(index.annotations[written.target_id].agent_note, "Runtime configuration boundary.");

  const orphan = runCli(indexFile, "note", written.target_id);
  assert.equal(orphan.orphaned, true);
  const orphanList = runCli(indexFile, "notes");
  assert.equal(orphanList.annotations[0].orphaned, true);

  const cleared = runCli(indexFile, "note", written.target_id, "--clear");
  assert.equal(cleared.orphaned, true);
  assert.equal(cleared.cleared, true);
  assert.equal(runCli(indexFile, "notes").count, 0);
});

test("new annotations require a current unambiguous target and bounded note text", () => {
  const root = createRepo();
  const indexFile = path.join(root, ".repoaxis.json");
  buildIndex({ root });

  assert.throws(() => setAnnotation(indexFile, "missingTarget", "note"), /node not found/);
  assert.throws(() => setAnnotation(indexFile, "src/config.js", " "), /must not be empty/);
  assert.throws(() => setAnnotation(indexFile, "src/config.js", "x".repeat(8193)), /at most 8192 characters/);

  setAnnotation(indexFile, "src/config.js", "file-level note");
  assert.equal(clearAnnotation(indexFile, "src/config.js").cleared, true);
});
