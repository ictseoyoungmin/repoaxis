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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-fs-"));
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

function filesystemNodeIds(index) {
  return Object.values(index.generated.nodes)
    .filter((node) => node.type === "folder" || node.type === "file")
    .map((node) => node.id)
    .sort();
}

function filesystemContainsPairs(index) {
  const nodes = index.generated.nodes;
  return index.generated.edges
    .filter((edge) => edge.type === "contains" && (nodes[edge.to]?.type === "folder" || nodes[edge.to]?.type === "file"))
    .map((edge) => `${edge.from} -> ${edge.to}`)
    .sort();
}

test("build indexes deterministic folder/file hierarchy", () => {
  const dir = copyFixture();
  const { index } = buildIndex({ root: dir });
  assert.equal(validateIndex(index).ok, true);
  assert.deepEqual(filesystemNodeIds(index), [
    "file:package.json",
    "file:src/index.js",
    "file:src/service.js",
    "file:src/utils.js",
    "folder:.",
    "folder:src",
  ]);
  assert.deepEqual(filesystemContainsPairs(index), [
    "folder:. -> file:package.json",
    "folder:. -> folder:src",
    "folder:src -> file:src/index.js",
    "folder:src -> file:src/service.js",
    "folder:src -> file:src/utils.js",
  ]);
  const meta = index.generated.nodes["file:src/index.js"].meta;
  assert.equal(meta.size_bytes, fs.statSync(path.join(dir, "src/index.js")).size);
  assert.equal(meta.extension, ".js");
  assert.equal(meta.symlink, false);
});

test("build includes visible untracked files and respects git ignore rules", () => {
  const dir = copyFixture();
  fs.writeFileSync(path.join(dir, ".gitignore"), "ignored/\n*.tmp\n");
  fs.mkdirSync(path.join(dir, "notes"));
  fs.writeFileSync(path.join(dir, "notes/todo.md"), "todo\n");
  fs.mkdirSync(path.join(dir, "ignored"));
  fs.writeFileSync(path.join(dir, "ignored/secret.txt"), "ignored\n");
  fs.writeFileSync(path.join(dir, "scratch.tmp"), "ignored\n");

  const { index } = buildIndex({ root: dir });
  const ids = filesystemNodeIds(index);
  assert.ok(ids.includes("file:.gitignore"));
  assert.ok(ids.includes("file:notes/todo.md"));
  assert.ok(ids.includes("folder:notes"));
  assert.ok(!ids.some((id) => id.includes("ignored/secret.txt")));
  assert.ok(!ids.some((id) => id.includes("scratch.tmp")));
});

test("deleted tracked files are absent from the current filesystem projection", () => {
  const dir = copyFixture();
  fs.rmSync(path.join(dir, "src/utils.js"));
  const { index } = buildIndex({ root: dir });
  assert.ok(!filesystemNodeIds(index).includes("file:src/utils.js"));
});
