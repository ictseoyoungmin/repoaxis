import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const output = fs.mkdtempSync(path.join(os.tmpdir(), "repoaxis-release-"));

try {
  execFileSync(process.execPath, ["dev/tools/validate-skill.mjs"], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, ["dev/tools/validate-package.mjs"], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, ["--test", "dev/tests/**/*.test.mjs"], { cwd: root, stdio: "inherit", shell: true });
  execFileSync(
    process.execPath,
    ["dev/tools/prepare-release.mjs", "--tag", `v${pkg.version}`, "--out", output],
    { cwd: root, stdio: "inherit" },
  );
  for (const required of [
    `repoaxis-${pkg.version}.tgz`,
    `repoaxis-${pkg.version}.tgz.sha256`,
    "release-manifest.json",
    "release-notes.md",
  ]) {
    if (!fs.existsSync(path.join(output, required))) throw new Error(`release dry-run missing asset: ${required}`);
  }
  console.log("release dry-run: ok");
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
