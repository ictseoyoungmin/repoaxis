import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";
import { importedBy, importsFrom } from "../../../skills/repoaxis/lib/query.mjs";
import { validateIndex } from "../../../skills/repoaxis/lib/schema.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const fixture = path.join(projectRoot, "dev/fixtures/imports");

function copyFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-imports-"));
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

function importPairs(index) {
  return index.generated.edges
    .filter((edge) => edge.type === "imports")
    .map((edge) => `${edge.from} -> ${edge.to}`)
    .sort();
}

test("build emits canonical local import edges and collapses duplicate relationships", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  assert.equal(validateIndex(index).ok, true);
  assert.deepEqual(importPairs(index), [
    "file:src/main.js -> file:src/common.cjs",
    "file:src/main.js -> file:src/lazy.js",
    "file:src/main.js -> file:src/lib/index.js",
    "file:src/main.js -> file:src/reexport.js",
    "file:src/main.js -> file:src/service.js",
    "file:src/service.js -> file:src/main.js",
  ]);

  const serviceEdge = index.generated.edges.find(
    (edge) => edge.type === "imports" && edge.from === "file:src/main.js" && edge.to === "file:src/service.js"
  );
  assert.deepEqual(serviceEdge.meta, { kinds: ["import"], specifiers: ["./service.js"] });

  const reexportEdge = index.generated.edges.find(
    (edge) => edge.type === "imports" && edge.from === "file:src/main.js" && edge.to === "file:src/reexport.js"
  );
  assert.deepEqual(reexportEdge.meta, { kinds: ["re-export"], specifiers: ["./reexport.js"] });
});

test("external and unresolved specifiers do not become graph nodes or edges", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  const meta = index.generated.nodes["file:src/main.js"].meta.imports;
  assert.deepEqual(
    {
      status: meta.status,
      count: meta.count,
      resolved_local: meta.resolved_local,
      resolved_targets: meta.resolved_targets,
      external: meta.external,
      external_specifiers: meta.external_specifiers,
      unresolved: meta.unresolved,
      unresolved_specifiers: meta.unresolved_specifiers,
    },
    { status: "ok", count: 9, resolved_local: 7, resolved_targets: 5, external: 1, external_specifiers: ["chalk"], unresolved: 1, unresolved_specifiers: ["./missing.js"] }
  );
  assert.ok(!Object.keys(index.generated.nodes).some((id) => id.includes("chalk")));
  assert.ok(!index.generated.edges.some((edge) => edge.type === "imported_by"));
});

test("reverse import traversal is derived from canonical imports edges", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  assert.deepEqual(importsFrom(index, "file:src/service.js").map((node) => node.id), ["file:src/main.js"]);
  assert.deepEqual(importedBy(index, "file:src/main.js").map((node) => node.id), ["file:src/service.js"]);
  assert.deepEqual(importedBy(index, "file:src/service.js").map((node) => node.id), ["file:src/main.js"]);
});
