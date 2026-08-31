import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { REPOAXIS_VERSION } from "../../../skills/repoaxis/lib/indexer.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function jsonRun(command, args, cwd) {
  return JSON.parse(run(command, args, cwd));
}

function git(root, ...args) {
  return run("git", ["-C", root, ...args], root);
}

function createFirstRunRepository(parent) {
  const root = path.join(parent, "first-run-repository");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, ".gitignore"), ".repoaxis.json\n", "utf8");
  fs.writeFileSync(
    path.join(root, "src", "main.js"),
    "import { parseConfig } from './config.js';\nexport function main() { return parseConfig({ port: 4173 }); }\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(root, "src", "config.js"),
    "export function parseConfig(input) { return { port: Number(input.port ?? 3000) }; }\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(root, "src", "worker.js"),
    "export function runWorker() { return 'scheduled externally'; }\n",
    "utf8",
  );
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Repoaxis First Run");
  git(root, "config", "user.email", "repoaxis@example.invalid");
  git(root, "add", ".");
  git(root, "commit", "-qm", "first run fixture");
  return root;
}

test("packed npm artifact installs and completes the documented first-run workflow", () => {
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-pack-"));
  const installDir = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-install-"));
  fs.writeFileSync(path.join(installDir, "package.json"), '{"name":"repoaxis-install-test","private":true}\n', "utf8");

  const packedName = run("npm", ["pack", "--ignore-scripts", "--silent", "--pack-destination", packDir], repositoryRoot)
    .split(/\r?\n/)
    .filter(Boolean)
    .at(-1);
  assert.ok(packedName?.endsWith(".tgz"));
  const tarball = path.join(packDir, packedName);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], installDir);

  const packageRoot = path.join(installDir, "node_modules", "repoaxis");
  assert.equal(fs.existsSync(path.join(packageRoot, "skills", "repoaxis", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, ".agents", "plugins", "marketplace.json")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, ".codex-plugin", "plugin.json")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, ".claude-plugin", "plugin.json")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, "dev")), false);

  const binary = path.join(installDir, "node_modules", ".bin", process.platform === "win32" ? "repoaxis.cmd" : "repoaxis");
  assert.equal(run(binary, ["version"], installDir), REPOAXIS_VERSION);

  const firstRunRoot = createFirstRunRepository(installDir);
  const doctor = jsonRun(binary, ["doctor"], firstRunRoot);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.repoaxis, REPOAXIS_VERSION);

  const built = jsonRun(binary, ["build"], firstRunRoot);
  assert.equal(built.ok, true);
  assert.ok(fs.existsSync(path.join(firstRunRoot, ".repoaxis.json")));

  const summary = jsonRun(binary, ["summary", ".repoaxis.json"], firstRunRoot);
  assert.equal(summary.schema_version, 1);
  assert.ok(summary.nodes >= 6);

  const found = jsonRun(binary, ["find", "parseConfig"], firstRunRoot);
  assert.equal(found.total, 1);
  assert.equal(found.matches.length, 1);
  assert.equal(found.matches[0].qualified_name, "parseConfig");

  const context = jsonRun(binary, ["context", "parseConfig"], firstRunRoot);
  assert.equal(context.file.node.path, "src/config.js");
  assert.deepEqual(context.dependencies.imported_by.map((node) => node.path), ["src/main.js"]);

  const why = jsonRun(binary, ["why", "parseConfig"], firstRunRoot);
  assert.ok(why.paths.some((record) => record.nodes.some((node) => node.path === "src/main.js")));

  const unreferenced = jsonRun(binary, ["unreferenced"], firstRunRoot);
  const candidatePaths = new Set(unreferenced.candidates.map((candidate) => candidate.node.path));
  assert.ok(candidatePaths.has("src/main.js"));
  assert.ok(candidatePaths.has("src/worker.js"));
  assert.match(unreferenced.caution, /not dead-code findings/i);

  const note = jsonRun(binary, ["note", "parseConfig", "First-run configuration boundary."], firstRunRoot);
  assert.equal(note.annotation.agent_note, "First-run configuration boundary.");
  fs.unlinkSync(path.join(firstRunRoot, ".repoaxis.json"));

  const recovered = jsonRun(binary, ["context", "parseConfig"], firstRunRoot);
  assert.equal(recovered.annotation.agent_note, "First-run configuration boundary.");
  assert.ok(fs.existsSync(path.join(firstRunRoot, ".repoaxis.json")));
});
