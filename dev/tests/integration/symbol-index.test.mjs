import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";
import { validateIndex } from "../../../skills/repoaxis/lib/schema.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const fixture = path.join(projectRoot, "dev/fixtures/symbol-js");

function copyFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-symbols-"));
  fs.cpSync(fixture, dir, { recursive: true });
  execFileSync("git", ["init", "-q", "-b", "main", dir]);
  execFileSync("git", ["-C", dir, "config", "user.name", "Repoaxis Test"]);
  execFileSync("git", ["-C", dir, "config", "user.email", "repoaxis@example.invalid"]);
  execFileSync("git", ["-C", dir, "add", "."]);
  execFileSync("git", ["-C", dir, "commit", "-q", "-m", "fixture"], {
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
      GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
    },
  });
  return dir;
}

function symbols(index, file = "src/model.js") {
  return Object.values(index.generated.nodes)
    .filter((node) => (node.type === "class" || node.type === "function") && node.path === file)
    .sort((a, b) => a.source.start_line - b.source.start_line || a.source.start_column - b.source.start_column);
}

test("build indexes JavaScript classes, functions, methods, arrows, and nested declarations", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  assert.equal(validateIndex(index).ok, true);

  const qns = symbols(index).map((node) => node.qualified_name);
  assert.deepEqual(qns, [
    "Greeter",
    "Greeter.constructor",
    "Greeter.greet",
    "Greeter.from#static",
    "Greeter.label#get",
    "Greeter.label#set",
    "Greeter.formatter",
    "normalize",
    "load",
    "load.decode",
    "default",
  ]);

  const greeter = index.generated.nodes["class:src/model.js::Greeter"];
  const greet = index.generated.nodes["function:src/model.js::Greeter.greet"];
  const nested = index.generated.nodes["function:src/model.js::load.decode"];
  assert.equal(greeter.parent_id, "file:src/model.js");
  assert.equal(greet.parent_id, greeter.id);
  assert.equal(nested.parent_id, "function:src/model.js::load");
  assert.equal(greeter.source.signature, "class Greeter extends BaseGreeter");
  assert.equal(greet.source.signature, "greet(name)");
  assert.equal(index.generated.nodes["function:src/model.js::normalize"].source.signature, "normalize = (value = \"\") =>");
  assert.equal(index.generated.nodes["function:src/model.js::load"].source.signature, "async function load(input)");
  assert.ok(Number.isInteger(greet.source.start_column));
  assert.ok(greet.source.end_line >= greet.source.start_line);
});

test("symbol containment uses canonical contains edges", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  const edges = new Set(index.generated.edges.map((edge) => `${edge.type}:${edge.from}->${edge.to}`));
  assert.ok(edges.has("contains:file:src/model.js->class:src/model.js::Greeter"));
  assert.ok(edges.has("contains:class:src/model.js::Greeter->function:src/model.js::Greeter.greet"));
  assert.ok(edges.has("contains:function:src/model.js::load->function:src/model.js::load.decode"));
});

test("parse failures degrade to file-level diagnostics without failing the build", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  const broken = index.generated.nodes["file:src/broken.js"];
  assert.equal(broken.meta.symbols.language, "javascript");
  assert.equal(broken.meta.symbols.parser, "acorn");
  assert.equal(broken.meta.symbols.parser_version, "8.15.0");
  assert.equal(broken.meta.symbols.status, "error");
  assert.equal(broken.meta.symbols.count, 0);
  assert.ok(Number.isInteger(broken.meta.symbols.error.line));
  assert.equal(symbols(index, "src/broken.js").length, 0);
  assert.equal(validateIndex(index).ok, true);
});
