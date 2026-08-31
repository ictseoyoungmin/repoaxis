import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  changedPaths,
  childrenOf,
  findNodes,
  parentsOf,
  refsFor,
  resolveNode,
  showNode,
} from "../../../skills/repoaxis/lib/query.mjs";

const CLI = fileURLToPath(new URL("../../../skills/repoaxis/scripts/cli.mjs", import.meta.url));

function fixtureIndex() {
  return {
    schema_version: 1,
    tool: { name: "repoaxis", version: "0.7.0" },
    authority: "git+working-tree",
    repository: { root: ".", head_sha: null, head_ref: null },
    generated: {
      nodes: {
        "folder:.": { id: "folder:.", type: "folder", path: "." },
        "folder:src": { id: "folder:src", type: "folder", path: "src" },
        "file:src/a.js": {
          id: "file:src/a.js",
          type: "file",
          path: "src/a.js",
          git: { tracked: true, working: "modified", staged: false, conflicted: false, last_commit: null },
        },
        "file:src/b.js": {
          id: "file:src/b.js",
          type: "file",
          path: "src/b.js",
          git: { tracked: true, working: "clean", staged: "modified", conflicted: false, last_commit: null },
        },
        "function:src/a.js::parseConfig": {
          id: "function:src/a.js::parseConfig",
          type: "function",
          path: "src/a.js",
          qualified_name: "parseConfig",
          parent_id: "file:src/a.js",
          source: { start_line: 1, start_column: 0, end_line: 1, end_column: 30, signature: "function parseConfig()" },
          meta: {},
        },
        "function:src/b.js::parseConfig": {
          id: "function:src/b.js::parseConfig",
          type: "function",
          path: "src/b.js",
          qualified_name: "parseConfig",
          parent_id: "file:src/b.js",
          source: { start_line: 1, start_column: 0, end_line: 1, end_column: 31, signature: "function parseConfig(x)" },
          meta: {},
        },
      },
      edges: [
        { type: "contains", from: "folder:.", to: "folder:src" },
        { type: "contains", from: "folder:src", to: "file:src/a.js" },
        { type: "contains", from: "folder:src", to: "file:src/b.js" },
        { type: "contains", from: "file:src/a.js", to: "function:src/a.js::parseConfig" },
        { type: "contains", from: "file:src/b.js", to: "function:src/b.js::parseConfig" },
        { type: "imports", from: "file:src/a.js", to: "file:src/b.js", meta: { specifiers: ["./b.js"], kinds: ["import"] } },
      ],
      git_changes: [
        { path: "removed.js", tracked: true, working: "deleted", staged: false, conflicted: false },
        { path: "src/a.js", tracked: true, working: "modified", staged: false, conflicted: false },
        { path: "src/b.js", tracked: true, working: "clean", staged: "modified", conflicted: false },
      ],
      refresh: { reason: "manual" },
    },
    annotations: { "function:src/a.js::parseConfig": { agent_note: "runtime entry" } },
  };
}

function runCli(indexFile, ...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args, "--index", indexFile], { encoding: "utf8" }));
}

test("query helpers resolve, search, and traverse deterministically", () => {
  const index = fixtureIndex();
  const found = findNodes(index, "src/a.js", { limit: 2 });
  assert.equal(found.total, 2);
  assert.deepEqual(found.matches.map((node) => node.id), ["file:src/a.js", "function:src/a.js::parseConfig"]);
  assert.equal(resolveNode(index, "src/a.js").id, "file:src/a.js");
  assert.equal(resolveNode(index, "src/a.js:parseConfig").id, "function:src/a.js::parseConfig");
  assert.throws(() => resolveNode(index, "parseConfig"), /ambiguous node target/);
  assert.equal(showNode(index, "src/a.js:parseConfig").annotation.agent_note, "runtime entry");
  assert.deepEqual(
    refsFor(index, "src/a.js").refs.map((ref) => [ref.type, ref.direction, ref.node.id]),
    [
      ["contains", "incoming", "folder:src"],
      ["contains", "outgoing", "function:src/a.js::parseConfig"],
      ["imports", "outgoing", "file:src/b.js"],
    ],
  );
  assert.deepEqual(parentsOf(index, "src/a.js:parseConfig").parents.map((node) => node.id), ["file:src/a.js"]);
  assert.deepEqual(childrenOf(index, "src/a.js").children.map((node) => node.id), ["function:src/a.js::parseConfig"]);
  assert.equal(changedPaths(index).count, 3);
  assert.deepEqual(changedPaths(index, { stagedOnly: true }).changes.map((change) => change.path), ["src/b.js"]);
});

test("CLI query commands emit compact JSON from an explicit index snapshot", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-query-cli-"));
  const indexFile = path.join(root, "index.json");
  fs.writeFileSync(indexFile, `${JSON.stringify(fixtureIndex())}\n`, "utf8");

  const found = runCli(indexFile, "find", "src/a.js", "--limit", "1");
  assert.equal(found.total, 2);
  assert.equal(found.matches.length, 1);
  assert.equal(found.matches[0].id, "file:src/a.js");

  const shown = runCli(indexFile, "show", "src/a.js:parseConfig");
  assert.equal(shown.node.id, "function:src/a.js::parseConfig");
  assert.equal(shown.annotation.agent_note, "runtime entry");

  const staged = runCli(indexFile, "changed", "--staged");
  assert.deepEqual(staged.changes.map((change) => change.path), ["src/b.js"]);
});
