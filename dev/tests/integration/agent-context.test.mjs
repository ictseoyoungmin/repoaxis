import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { agentContext, whyNode } from "../../../skills/repoaxis/lib/agent-context.mjs";

const CLI = fileURLToPath(new URL("../../../skills/repoaxis/scripts/cli.mjs", import.meta.url));

function fixtureIndex() {
  return {
    schema_version: 1,
    tool: { name: "repoaxis", version: "0.8.0" },
    authority: "git+working-tree",
    repository: { root: ".", head_sha: "a".repeat(40), head_ref: "main" },
    generated: {
      nodes: {
        "folder:.": { id: "folder:.", type: "folder", path: "." },
        "folder:src": { id: "folder:src", type: "folder", path: "src" },
        "file:src/main.js": {
          id: "file:src/main.js", type: "file", path: "src/main.js",
          git: { tracked: true, working: "clean", staged: false, conflicted: false, last_commit: null },
        },
        "file:src/service.js": {
          id: "file:src/service.js", type: "file", path: "src/service.js",
          git: { tracked: true, working: "clean", staged: false, conflicted: false, last_commit: null },
        },
        "file:src/parser.js": {
          id: "file:src/parser.js", type: "file", path: "src/parser.js",
          git: {
            tracked: true, working: "modified", staged: false, conflicted: false,
            last_commit: {
              sha: "b".repeat(40), author_name: "Repoaxis Test",
              authored_at: "2026-08-31T10:00:00+09:00", committed_at: "2026-08-31T10:00:00+09:00",
              subject: "update parser",
            },
          },
        },
        "function:src/parser.js::parseConfig": {
          id: "function:src/parser.js::parseConfig", type: "function", path: "src/parser.js",
          qualified_name: "parseConfig", parent_id: "file:src/parser.js",
          source: {
            start_line: 4, start_column: 0, end_line: 6, end_column: 1,
            signature: "function parseConfig(input)",
          },
          meta: {},
        },
      },
      edges: [
        { type: "contains", from: "folder:.", to: "folder:src" },
        { type: "contains", from: "folder:src", to: "file:src/main.js" },
        { type: "contains", from: "folder:src", to: "file:src/service.js" },
        { type: "contains", from: "folder:src", to: "file:src/parser.js" },
        { type: "contains", from: "file:src/parser.js", to: "function:src/parser.js::parseConfig" },
        { type: "imports", from: "file:src/main.js", to: "file:src/service.js" },
        { type: "imports", from: "file:src/service.js", to: "file:src/parser.js" },
      ],
      git_changes: [
        { path: "src/parser.js", tracked: true, working: "modified", staged: false, conflicted: false },
      ],
      refresh: { reason: "manual" },
    },
    annotations: {
      "folder:src": { agent_note: "application source boundary" },
      "function:src/parser.js::parseConfig": { agent_note: "configuration boundary" },
    },
  };
}

function runCli(indexFile, ...args) {
  return JSON.parse(execFileSync(process.execPath, [CLI, ...args, "--index", indexFile], { encoding: "utf8" }));
}

test("context composes focused structural, Git, and annotation evidence", () => {
  const context = agentContext(fixtureIndex(), "parseConfig");
  assert.equal(context.target.id, "function:src/parser.js::parseConfig");
  assert.deepEqual(context.location, { start_line: 4, start_column: 0, end_line: 6, end_column: 1 });
  assert.deepEqual(context.containment_path.map((node) => node.id), ["folder:.", "folder:src", "file:src/parser.js"]);
  assert.deepEqual(context.dependencies.imported_by.map((node) => node.id), ["file:src/service.js"]);
  assert.equal(context.file.git.last_commit.subject, "update parser");
  assert.equal(context.file.change.working, "modified");
  assert.equal(context.annotation.agent_note, "configuration boundary");
  assert.deepEqual(context.annotations.map((record) => record.node_id), ["folder:src", "function:src/parser.js::parseConfig"]);
});

test("why explains only indexed imports and containment", () => {
  const result = whyNode(fixtureIndex(), "parseConfig");
  assert.equal(result.origin_rule.includes("not inferred as a runtime entry point"), true);
  assert.deepEqual(result.paths[0].nodes.map((node) => node.id), [
    "file:src/main.js",
    "file:src/service.js",
    "file:src/parser.js",
    "function:src/parser.js::parseConfig",
  ]);
  assert.deepEqual(result.paths[0].edges.map((edge) => edge.type), ["imports", "imports", "contains"]);
});

test("CLI context and why emit the same compact snapshot projections", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-agent-context-"));
  const indexFile = path.join(root, "index.json");
  fs.writeFileSync(indexFile, `${JSON.stringify(fixtureIndex())}\n`, "utf8");

  const context = runCli(indexFile, "context", "parseConfig");
  assert.equal(context.target.id, "function:src/parser.js::parseConfig");
  assert.equal(context.file.node.id, "file:src/parser.js");

  const why = runCli(indexFile, "why", "parseConfig", "--max-depth", "8", "--max-paths", "2");
  assert.deepEqual(why.paths[0].edges.map((edge) => edge.type), ["imports", "imports", "contains"]);
});
