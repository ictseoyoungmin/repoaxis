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

test("packed npm artifact installs the CLI and plugin/skill surfaces without dev assets", () => {
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
  assert.equal(fs.existsSync(path.join(packageRoot, ".codex-plugin", "plugin.json")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, ".claude-plugin", "plugin.json")), true);
  assert.equal(fs.existsSync(path.join(packageRoot, "dev")), false);

  const binary = path.join(installDir, "node_modules", ".bin", process.platform === "win32" ? "repoaxis.cmd" : "repoaxis");
  assert.equal(run(binary, ["version"], installDir), REPOAXIS_VERSION);
});
