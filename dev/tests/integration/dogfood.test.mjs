import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { agentContext, whyNode } from "../../../skills/repoaxis/lib/agent-context.mjs";
import { setAnnotation } from "../../../skills/repoaxis/lib/annotations.mjs";
import { unreferencedCandidates } from "../../../skills/repoaxis/lib/candidates.mjs";
import { readOperationalIndex } from "../../../skills/repoaxis/lib/fresh-index.mjs";
import { buildIndex } from "../../../skills/repoaxis/lib/indexer.mjs";
import { stableStringify } from "../../../skills/repoaxis/lib/stable-json.mjs";
import { startViewer } from "../../../skills/repoaxis/lib/view-server.mjs";
import { DOGFOOD_FILE_COUNT, materializeDogfoodRepository } from "../../fixtures/dogfood-js/create-fixture.mjs";

const repoaxisCli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../skills/repoaxis/scripts/cli.mjs");

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function cli(root, ...args) {
  return JSON.parse(execFileSync(process.execPath, [repoaxisCli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim());
}

function createDogfoodRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-dogfood-"));
  materializeDogfoodRepository(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Repoaxis Dogfood");
  git(root, "config", "user.email", "repoaxis@example.invalid");
  git(root, "add", ".");
  git(root, "commit", "-qm", "dogfood fixture");
  return root;
}

function pathSet(pathRecord) {
  return new Set(pathRecord.nodes.filter((node) => node.type === "file").map((node) => node.path));
}

test("representative repository proves agent narrowing, conservative candidates, durable notes, refresh, and viewer", async () => {
  assert.ok(DOGFOOD_FILE_COUNT >= 20 && DOGFOOD_FILE_COUNT <= 50);
  const root = createDogfoodRepo();
  const first = buildIndex({ root, reason: "dogfood" }).index;
  const fileNodes = Object.values(first.generated.nodes).filter((node) => node.type === "file");
  assert.ok(fileNodes.length >= 30);

  const context = agentContext(first, "parseConfig");
  assert.equal(context.file.node.path, "src/config/parse.js");
  assert.deepEqual(context.dependencies.imported_by.map((node) => node.path), ["src/config/load.js"]);

  const why = whyNode(first, "parseConfig", { maxDepth: 8, maxPaths: 5 });
  assert.ok(why.paths.length >= 2);
  const provenanceFiles = why.paths.map(pathSet);
  assert.ok(provenanceFiles.some((paths) => paths.has("src/cli.js")));
  assert.ok(provenanceFiles.some((paths) => paths.has("src/server.js")));
  assert.ok(provenanceFiles.every((paths) => paths.size <= 5));
  assert.ok(Math.max(...provenanceFiles.map((paths) => paths.size)) < fileNodes.length / 4);

  const candidates = unreferencedCandidates(first);
  const candidateIds = new Set(candidates.candidates.map((entry) => entry.node.id));
  assert.equal(candidates.basis, "no-incoming-repository-imports");
  assert.match(candidates.caution, /not dead-code findings/i);
  assert.ok(candidateIds.has("file:src/cli.js"));
  assert.ok(candidateIds.has("file:src/server.js"));
  assert.ok(candidateIds.has("file:scripts/migrate.js"));

  const cliCandidates = cli(root, "unreferenced");
  assert.equal(cliCandidates.basis, candidates.basis);
  assert.ok(cliCandidates.candidates.some((entry) => entry.node.id === "file:scripts/migrate.js"));

  const indexPath = path.join(root, ".repoaxis.json");
  setAnnotation(indexPath, "scripts/migrate.js", "Invoked by the package.json migrate script; not a dead-code finding.");
  const normalized = buildIndex({ root, reason: "dogfood" }).index;
  const generatedBeforeDelete = stableStringify(normalized.generated);
  assert.equal(normalized.annotations["file:scripts/migrate.js"].agent_note.includes("package.json"), true);

  fs.unlinkSync(indexPath);
  const rebuilt = buildIndex({ root, reason: "dogfood" }).index;
  assert.equal(stableStringify(rebuilt.generated), generatedBeforeDelete);
  assert.equal(rebuilt.annotations["file:scripts/migrate.js"].agent_note.includes("package.json"), true);

  fs.appendFileSync(path.join(root, "src/config/defaults.js"), "export const dogfoodEdit = true;\n", "utf8");
  fs.appendFileSync(path.join(root, "src/features/flags.js"), "export const stagedDogfood = true;\n", "utf8");
  git(root, "add", "src/features/flags.js");
  fs.unlinkSync(path.join(root, "src/utils/clock.js"));
  fs.mkdirSync(path.join(root, "src/experiments"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/experiments/new-policy.js"), "export const policy = 'candidate';\n", "utf8");

  const refreshed = readOperationalIndex({ cwd: root });
  assert.equal(refreshed.refreshed, true);
  assert.equal(refreshed.reason, "working-tree-changed");
  const changes = new Map(refreshed.index.generated.git_changes.map((change) => [change.path, change]));
  assert.equal(changes.get("src/config/defaults.js").working, "modified");
  assert.equal(changes.get("src/features/flags.js").staged, "modified");
  assert.equal(changes.get("src/utils/clock.js").working, "deleted");
  assert.equal(changes.get("src/experiments/new-policy.js").working, "untracked");
  assert.equal(refreshed.index.annotations["file:scripts/migrate.js"].agent_note.includes("package.json"), true);

  const viewer = await startViewer({ root, port: 0, open: false });
  try {
    const response = await fetch(new URL("/api/index", viewer.url));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(Object.keys(body.index.generated.nodes).length > 40);
    assert.ok(body.index.generated.edges.some((edge) => edge.type === "imports"));
    assert.equal(body.index.annotations["file:scripts/migrate.js"].agent_note.includes("package.json"), true);
  } finally {
    await new Promise((resolve) => viewer.server.close(resolve));
  }
});
