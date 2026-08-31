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
const fixture = path.join(projectRoot, "dev/fixtures/tiny-js");

function copyFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-fixture-"));
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

test("build is byte-stable for the same repository state", () => {
  const dir = copyFixture();
  const first = buildIndex({ root: dir });
  const a = fs.readFileSync(first.output, "utf8");
  const second = buildIndex({ root: dir });
  const b = fs.readFileSync(second.output, "utf8");
  assert.equal(a, b);
  assert.equal(validateIndex(second.index).ok, true);
  assert.equal(Object.keys(second.index.generated.nodes).length, 8);
  assert.equal(second.index.generated.edges.length, 9);
  assert.equal(Boolean(second.index.generated.nodes["file:.repoaxis.json"]), false);
});

test("rebuild preserves valid annotations", () => {
  const dir = copyFixture();
  const result = buildIndex({ root: dir });
  const parsed = JSON.parse(fs.readFileSync(result.output, "utf8"));
  parsed.annotations["file:src/index.js"] = { agent_note: "Entry point invoked by the package script." };
  fs.writeFileSync(result.output, `${JSON.stringify(parsed, null, 2)}\n`);
  const rebuilt = buildIndex({ root: dir });
  assert.deepEqual(rebuilt.index.annotations, {
    "file:src/index.js": { agent_note: "Entry point invoked by the package script." },
  });
});
