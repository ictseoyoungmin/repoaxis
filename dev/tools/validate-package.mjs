import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const required = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "skills/repoaxis/SKILL.md",
  "skills/repoaxis/schemas/repoaxis.schema.json",
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
if (pkg.name !== "repoaxis" || pkg.bin?.repoaxis !== "./bin/repoaxis") throw new Error("package CLI contract is invalid");
for (const manifest of [codex, claude]) {
  if (manifest.name !== "repoaxis") throw new Error("plugin name mismatch");
  if (manifest.version !== pkg.version) throw new Error("plugin version mismatch");
}
if (codex.skills !== "./skills/") throw new Error("Codex skills path must be ./skills/");
console.log("package structure: ok");
