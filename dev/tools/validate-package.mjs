import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const required = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "skills/repoaxis/SKILL.md",
  "skills/repoaxis/schemas/repoaxis.schema.json",
  "skills/repoaxis/lib/vendor/acorn-8.15.0.mjs",
  "skills/repoaxis/lib/vendor/ACORN-LICENSE.txt",
  "docs/third-party.md",
  "bin/repoaxis",
  "README.md",
  "CHANGELOG.md",
  "package.json",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`missing required path: ${rel}`);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const codex = JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin/plugin.json"), "utf8"));
const claude = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
const { REPOAXIS_VERSION } = await import(pathToFileURL(path.join(root, "skills/repoaxis/lib/indexer.mjs")));
const { JAVASCRIPT_PARSER } = await import(pathToFileURL(path.join(root, "skills/repoaxis/lib/languages/javascript.mjs")));
if (pkg.name !== "repoaxis" || pkg.bin?.repoaxis !== "./bin/repoaxis") throw new Error("package CLI contract is invalid");
if (REPOAXIS_VERSION !== pkg.version) throw new Error("runtime version mismatch");
for (const manifest of [codex, claude]) {
  if (manifest.name !== "repoaxis") throw new Error("plugin name mismatch");
  if (manifest.version !== pkg.version) throw new Error("plugin version mismatch");
}
if (codex.skills !== "./skills/") throw new Error("Codex skills path must be ./skills/");
if (JAVASCRIPT_PARSER.name !== "acorn" || JAVASCRIPT_PARSER.version !== "8.15.0") {
  throw new Error("JavaScript parser pin is invalid");
}
const vendor = fs.readFileSync(path.join(root, "skills/repoaxis/lib/vendor/acorn-8.15.0.mjs"), "utf8");
if (!vendor.includes('version = "8.15.0"') && !vendor.includes("version = '8.15.0'")) {
  throw new Error("Acorn vendored runtime does not identify version 8.15.0");
}
const license = fs.readFileSync(path.join(root, "skills/repoaxis/lib/vendor/ACORN-LICENSE.txt"), "utf8");
if (!license.includes("MIT License")) throw new Error("Acorn MIT license text is missing");
console.log("package structure: ok");
