import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
execFileSync(process.execPath, ["dev/tools/validate-skill.mjs"], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, ["dev/tools/validate-package.mjs"], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, ["--test", "dev/tests/**/*.test.mjs"], { cwd: root, stdio: "inherit", shell: true });
execFileSync("npm", ["pack", "--dry-run"], { cwd: root, stdio: "inherit" });
