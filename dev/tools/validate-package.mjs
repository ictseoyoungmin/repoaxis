import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateReleaseContract } from "./release-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const required = [
  ".agents/plugins/marketplace.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".github/workflows/release.yml",
  "skills/repoaxis/SKILL.md",
  "skills/repoaxis/schemas/repoaxis.schema.json",
  "skills/repoaxis/lib/view-server.mjs",
  "skills/repoaxis/lib/view-snapshot.mjs",
  "skills/repoaxis/viewer/repoaxis.html",
  "skills/repoaxis/lib/vendor/acorn-8.15.0.mjs",
  "skills/repoaxis/lib/vendor/ACORN-LICENSE.txt",
  "docs/releasing.md",
  "docs/third-party.md",
  "docs/viewer.md",
  "bin/repoaxis",
  "README.md",
  "CHANGELOG.md",
  "package.json",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`missing required path: ${rel}`);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const marketplace = JSON.parse(fs.readFileSync(path.join(root, ".agents/plugins/marketplace.json"), "utf8"));
const codex = JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin/plugin.json"), "utf8"));
const claude = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
const { REPOAXIS_VERSION } = await import(pathToFileURL(path.join(root, "skills/repoaxis/lib/indexer.mjs")));
const { JAVASCRIPT_PARSER } = await import(pathToFileURL(path.join(root, "skills/repoaxis/lib/languages/javascript.mjs")));
if (pkg.name !== "repoaxis" || pkg.bin?.repoaxis !== "./bin/repoaxis") throw new Error("package CLI contract is invalid");
if (pkg.repository?.url !== "git+https://github.com/ictseoyoungmin/repoaxis.git") throw new Error("npm repository metadata is invalid");
if (!pkg.files?.includes(".agents/plugins/")) throw new Error("npm package must include the plugin marketplace");
if (REPOAXIS_VERSION !== pkg.version) throw new Error("runtime version mismatch");
for (const manifest of [codex, claude]) {
  if (manifest.name !== "repoaxis") throw new Error("plugin name mismatch");
  if (manifest.version !== pkg.version) throw new Error("plugin version mismatch");
}
if (codex.skills !== "./skills/") throw new Error("Codex skills path must be ./skills/");
if (marketplace.name !== "repoaxis" || marketplace.interface?.displayName !== "Repoaxis") {
  throw new Error("marketplace identity is invalid");
}
if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length !== 1) {
  throw new Error("marketplace must expose exactly one Repoaxis plugin");
}
const entry = marketplace.plugins[0];
if (entry.name !== "repoaxis" || entry.source?.source !== "local" || entry.source?.path !== "./") {
  throw new Error("marketplace Repoaxis source must resolve to the repository root");
}
if (entry.policy?.installation !== "AVAILABLE" || entry.policy?.authentication !== "ON_INSTALL") {
  throw new Error("marketplace policy is invalid");
}
if (entry.category !== "Developer Tools") throw new Error("marketplace category is invalid");
if (JAVASCRIPT_PARSER.name !== "acorn" || JAVASCRIPT_PARSER.version !== "8.15.0") {
  throw new Error("JavaScript parser pin is invalid");
}
const vendor = fs.readFileSync(path.join(root, "skills/repoaxis/lib/vendor/acorn-8.15.0.mjs"), "utf8");
if (!vendor.includes('version = "8.15.0"') && !vendor.includes("version = '8.15.0'")) {
  throw new Error("Acorn vendored runtime does not identify version 8.15.0");
}
const license = fs.readFileSync(path.join(root, "skills/repoaxis/lib/vendor/ACORN-LICENSE.txt"), "utf8");
if (!license.includes("MIT License")) throw new Error("Acorn MIT license text is missing");
validateReleaseContract(root);
console.log("package structure: ok");
